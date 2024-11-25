import os
import time
import schedule
import smtplib
from email.mime.text import MIMEText
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from dotenv import load_dotenv
from plyer import notification

# Load environment variables
load_dotenv()

class DeliverySlotChecker:
    def __init__(self):
        self.email = os.getenv('EMAIL')
        self.password = os.getenv('PASSWORD')
        self.smtp_server = os.getenv('SMTP_SERVER')
        self.smtp_port = int(os.getenv('SMTP_PORT', 587))
        self.smtp_username = os.getenv('SMTP_USERNAME')
        self.smtp_password = os.getenv('SMTP_PASSWORD')
        self.check_interval = int(os.getenv('CHECK_INTERVAL_MINUTES', 15))
        self.setup_driver()

    def setup_driver(self):
        chrome_options = Options()
        if os.getenv('HEADLESS', 'true').lower() == 'true':
            chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=chrome_options)

    def login(self):
        try:
            self.driver.get('https://www.wholefoodsmarket.com/amazon-account/sign-in')
            
            # Wait for email input and enter email
            email_input = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.ID, 'ap_email'))
            )
            email_input.send_keys(self.email)
            
            # Find and click continue button
            continue_button = self.driver.find_element(By.ID, 'continue')
            continue_button.click()
            
            # Wait for password input and enter password
            password_input = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.ID, 'ap_password'))
            )
            password_input.send_keys(self.password)
            
            # Find and click sign-in button
            sign_in_button = self.driver.find_element(By.ID, 'signInSubmit')
            sign_in_button.click()
            
            return True
        except Exception as e:
            print(f"Login failed: {str(e)}")
            return False

    def check_delivery_slots(self):
        try:
            self.driver.get('https://www.wholefoodsmarket.com/shop/choose-store')
            
            # Wait for delivery slots to load
            slots = WebDriverWait(self.driver, 10).until(
                EC.presence_of_all_elements_located((By.CLASS_NAME, 'delivery-slot'))
            )
            
            available_slots = []
            for slot in slots:
                if 'available' in slot.get_attribute('class').lower():
                    slot_text = slot.text
                    available_slots.append(slot_text)
            
            return available_slots
        except Exception as e:
            print(f"Error checking delivery slots: {str(e)}")
            return []

    def send_notification(self, slots):
        # Desktop notification
        notification.notify(
            title='Delivery Slots Available!',
            message=f'Found {len(slots)} available delivery slots!',
            app_icon=None,
            timeout=10,
        )
        
        # Email notification
        if self.smtp_username and self.smtp_password:
            try:
                msg = MIMEText(f"Available delivery slots:\n\n" + "\n".join(slots))
                msg['Subject'] = 'Delivery Slots Available!'
                msg['From'] = self.smtp_username
                msg['To'] = self.email

                with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                    server.starttls()
                    server.login(self.smtp_username, self.smtp_password)
                    server.send_message(msg)
            except Exception as e:
                print(f"Failed to send email notification: {str(e)}")

    def run(self):
        if self.login():
            available_slots = self.check_delivery_slots()
            if available_slots:
                self.send_notification(available_slots)
                print("Found available slots:", available_slots)
            else:
                print("No delivery slots available")
        self.driver.quit()

def main():
    checker = DeliverySlotChecker()
    
    # Schedule regular checks
    schedule.every(checker.check_interval).minutes.do(checker.run)
    
    # Run first check immediately
    checker.run()
    
    # Keep running scheduled checks
    while True:
        schedule.run_pending()
        time.sleep(60)

if __name__ == "__main__":
    main()
