import pandas as pd
import re
from email_validator import validate_email
from webdriver_manager.chrome import ChromeDriverManager
from webdriver_manager.firefox import GeckoDriverManager
from webdriver_manager.microsoft import EdgeChromiumDriverManager
from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException, WebDriverException
import logging
import os
import time

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")


def setup_driver(browser="chrome", headless=True):
    logging.info(f"Setting up webdriver for {browser} (headless={headless})")
    options = None
    driver = None

    if browser.lower() == "chrome":
        options = webdriver.ChromeOptions()
        if headless:
            options.add_argument("--headless")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        try:
            driver = webdriver.Chrome(service=webdriver.chrome.service.Service(ChromeDriverManager().install()),
                                      options=options)
        except WebDriverException as e:
            logging.critical(f"Failed to initialize Chrome WebDriver: {e}")
            raise
    elif browser.lower() == "firefox":
        options = webdriver.FirefoxOptions()
        if headless:
            options.add_argument("--headless")
        try:
            driver = webdriver.Firefox(service=webdriver.firefox.service.Service(GeckoDriverManager().install()),
                                       options=options)
        except WebDriverException as e:
            logging.critical(f"Failed to initialize Firefox WebDriver: {e}")
            raise
    elif browser.lower() == "edge":
        options = webdriver.EdgeOptions()
        if headless:
            options.add_argument("--headless")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        try:
            driver = webdriver.Edge(service=webdriver.edge.service.Service(EdgeChromiumDriverManager().install()),
                                    options=options)
        except WebDriverException as e:
            logging.critical(f"Failed to initialize Edge WebDriver: {e}")
            raise
    else:
        raise ValueError(f"Unsupported browser: {browser}. Choose 'chrome', 'firefox', or 'edge'")

    return driver


def validate_phone_number(phone_number):
    phone_pattern = r'^\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$'
    return phone_number if phone_number != "N/A" and re.match(phone_pattern, phone_number) else "N/A"


def validate_email_address(email_address):
    try:
        validate_email(email_address, check_deliverability=False)
        return email_address
    except Exception:
        return "N/A"


def validate_url(url):
    url_pattern = r'^(https?:\/\/)?([\w\-]+(\.[\w\-]+)+)(\/.*)?$'
    return url if url != "N/A" and re.match(url_pattern, url, re.IGNORECASE) else "N/A"


def extract_info(driver, url):
    logging.info(f"Extracting info from: {url}")
    try:
        driver.get(url)
        WebDriverWait(driver, 15).until(EC.presence_of_element_located((By.TAG_NAME, "body")))
        time.sleep(3)  # Increased wait for dynamic content
    except TimeoutException:
        logging.warning(f"Timeout navigating to {url}. Page might not have loaded correctly.")
        return {}
    except WebDriverException as e:
        logging.error(f"WebDriver error navigating to {url}: {e}")
        return {}

    business_data = {
        'Business Name': "N/A",
        'Address': "N/A",
        'Phone': "N/A",
        'Website': "N/A",
        'Email': "N/A",
        # 'URL': url
    }

    # Try to extract general info (works better with company websites)
    try:
        business_name_element = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//h1|//h2"))
        )
        business_data['Business Name'] = business_name_element.text.strip() or "N/A"
    except (TimeoutException, NoSuchElementException):
        logging.warning("Business name element not found.")

    try:
        address_element = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//address|//div[contains(@class, 'address')]"))
        )
        business_data['Address'] = address_element.text.strip() or "N/A"
    except (TimeoutException, NoSuchElementException):
        logging.warning("Address element not found.")

    try:
        phone_element = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//a[contains(@href, 'tel:')]"))
        )
        business_data['Phone'] = validate_phone_number(
            phone_element.text.strip() or phone_element.get_attribute("href").replace("tel:", ""))
    except (TimeoutException, NoSuchElementException):
        logging.warning("Phone element not found.")

    # --- NEW LOGIC: Try to extract the website from Google Maps (if on a Google Maps page) ---
    website_url = None
    if "google.com/maps" in url:
        try:
            website_element = driver.find_element(
                By.XPATH,
                "//a[contains(@href, 'http') and (contains(text(), 'Website') or contains(@aria-label, 'Website'))]"
            )
            website_url = website_element.get_attribute("href")
            business_data['Website'] = validate_url(website_url)
        except NoSuchElementException:
            business_data['Website'] = "N/A"
    else:
        business_data['Website'] = validate_url(url)

    # --- Email extraction ---
    # If we are on a Google Maps page and found a website, visit the website to extract email
    if "google.com/maps" in url and business_data['Website'] != "N/A":
        try:
            driver.get(business_data['Website'])
            WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "body")))
            time.sleep(3)  # Wait for dynamic content
            email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
            page_source = driver.page_source.lower()
            emails = re.findall(email_pattern, page_source)
            if emails:
                business_data['Email'] = validate_email_address(emails[0])
                logging.info(f"Email found on website: {business_data['Email']}")
            else:
                logging.warning("No email found on business website.")
        except Exception as e:
            logging.error(f"Error extracting email from business website: {e}")
    else:
        # Enhanced email extraction for non-Google Maps URLs (i.e., direct business websites)
        try:
            WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.TAG_NAME, "body")))
            time.sleep(3)  # Wait for dynamic content
            email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
            page_source = driver.page_source.lower()
            emails = re.findall(email_pattern, page_source)
            if emails:
                business_data['Email'] = validate_email_address(emails[0])
                logging.info(f"Email found: {business_data['Email']}")
            else:
                logging.warning("No email found in page source. Checking common email links...")
                try:
                    email_link = WebDriverWait(driver, 10).until(
                        EC.presence_of_element_located((By.XPATH, "//a[contains(@href, 'mailto:')]"))
                    )
                    email = email_link.get_attribute("href").replace("mailto:", "").strip()
                    if re.match(email_pattern, email):
                        business_data['Email'] = validate_email_address(email)
                        logging.info(f"Email found in mailto link: {business_data['Email']}")
                except (TimeoutException, NoSuchElementException):
                    logging.warning("No mailto link found.")
        except Exception as e:
            logging.error(f"Error during email extraction: {e}")

    return business_data


def main(urls=None, browser="chrome", headless=True, output_file="business_info.csv"):
    expected_columns = ['Business Name', 'Address', 'Phone', 'Website', 'Email', 'URL']
    driver = None
    try:
        driver = setup_driver(browser, headless)
        if urls is None:
            try:
                with open("urls.txt", "r") as f:
                    urls = [line.strip() for line in f if line.strip()]
            except FileNotFoundError:
                urls = [
                    "http://thebuffalolakehouse.square.site/"
                ]

        business_data_list = []
        existing_urls = set()

        if os.path.exists(output_file):
            try:
                existing_df = pd.read_csv(output_file)
                for col in expected_columns:
                    if col not in existing_df.columns:
                        existing_df[col] = "N/A"
                if 'URL' in existing_df.columns:
                    existing_urls = set(existing_df['URL'].dropna().astype(str))
            except pd.errors.EmptyDataError:
                logging.warning(f"{output_file} is empty or corrupted.")
                existing_df = pd.DataFrame(columns=expected_columns)
            except Exception as e:
                logging.error(f"Error reading {output_file}: {e}")
                existing_df = pd.DataFrame(columns=expected_columns)
        else:
            existing_df = pd.DataFrame(columns=expected_columns)

        for url in urls:
            if validate_url(url) != "N/A" and url not in existing_urls:
                business_data = extract_info(driver, url)
                if business_data:
                    business_data_list.append(business_data)

        if business_data_list:
            new_df = pd.DataFrame(business_data_list)
            for col in expected_columns:
                if col not in new_df.columns:
                    new_df[col] = "N/A"
            new_df = new_df[expected_columns]
            combined_df = pd.concat([existing_df, new_df], ignore_index=True)
            combined_df = combined_df.drop_duplicates(subset=['URL'], keep='last')
            combined_df.to_csv(output_file, index=False)
            print(combined_df.to_string())
            logging.info(f"Data appended to {output_file}")
        else:
            print(existing_df.to_string())
            logging.warning("No new data extracted.")

    except Exception as e:
        logging.critical(f"An unhandled error occurred: {e}")
    finally:
        if driver:
            driver.quit()
            logging.info("WebDriver closed.")


if __name__ == "__main__":
    main(urls=None, browser="chrome", headless=True)
