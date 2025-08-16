import requests
import json
import time
import pandas as pd
from datetime import datetime
import os
import random

def call_producer_api():
    """Call the producer API with current timestamp"""
    # Get current timestamp in milliseconds
    current_ts = int(time.time() * 1000)
    
    url = "https://report.taurus.cash/reportclient/producerController/send"
    
    headers = {
        "accept": "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/json",
        "origin": "https://h5-share.agent61.com",
        "priority": "u=1, i",
        "referer": "https://h5-share.agent61.com/",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site",
        "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
    }
    
    # Update the timestamp in the payload
    payload = {
        "code": "fwxeqk",
        "ts": current_ts,
        "cts": "",
        "pkg": "com.bauk.nibwf",
        "channel": "slm_1100014",
        "pn": "hy",
        "ip": "",
        "platform": "vungo",
        "aid": "92337cb6ce3ec1fa",
        "gaid": "396124e8-87ce-46f4-a5ef-a6205ad8d2ef",
        "taurus_stat_uuid": None,
        "uid": "105632431",
        "type": "event",
        "listJson": [
            {
                "ts": str(int(current_ts / 1000)),  # Convert to seconds for this field
                "eventKey": "tcpa_w/d_Historical",
                "eventValue": ""
            }
        ]
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        print(f"Producer API called successfully. Status: {response.status_code}")
        print(f"Response: {response.text}")
        return True
    except Exception as e:
        print(f"Error calling producer API: {e}")
        return False

def fetch_withdraw_data():
    """Fetch withdrawal data from all 68 pages - calling both APIs for each page"""
    url = "https://landscape-api.taurus.cash/awclient/landscape/withdraw/withdrawDetail"
    
    headers = {
        "accept": "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/json;charset=UTF-8",
        "origin": "https://h5-share.agent61.com",
        "priority": "u=1, i",
        "referer": "https://h5-share.agent61.com/",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site",
        "sec-fetch-storage-access": "active",
        "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIxMTEyMDMyNTkwMyIsImlhdCI6MTczNzMwMzcyNCwiZXhwIjoxNTY5Mzc4OTAzNzI0fQ.p7EBWCIFM2yRgWvFLJTdoqmk2pFcf7kCE_iDsXIwMcJP8kztBdiXmRHKLrLy0WndaYnOyjf0Y0Pp_RS4njU4mw",
        "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
    }
    
    all_records = []
    
    for page in range(1, 4):  # Pages 1 to 84 (will stop early if no more records)
        time.sleep(random.uniform(10, 20))  # Random delay between 10-20 seconds to avoid overwhelming the server
        # Step 1: Call producer API for this page
        print(f"Page {page}/84 - Step 1: Calling producer API...")
        if not call_producer_api():
            print(f"Failed to call producer API for page {page}. Continuing...")
        
        # Step 2: Fetch withdrawal data for this page
        payload = {
            "page": page,
            "size": 15
        }
        
        try:
            print(f"Page {page}/84 - Step 2: Fetching withdrawal data...")
            response = requests.post(url, headers=headers, json=payload)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("code") == 0 and "data" in data and "records" in data["data"]:
                    records = data["data"]["records"]
                    all_records.extend(records)
                    print(f"Page {page}: Found {len(records)} records (Total so far: {len(all_records)})")
                    
                    # If no records found, we might have reached the end
                    if len(records) == 0:
                        print(f"No more records found at page {page}. Stopping.")
                        break
                else:
                    print(f"Page {page}: No data or error in response")
                    print(f"Response: {response.text}")
            else:
                print(f"Page {page}: HTTP Error {response.status_code}")
                print(f"Response: {response.text}")
                
        except Exception as e:
            print(f"Error fetching page {page}: {e}")
            continue
        
        # Small delay to avoid overwhelming the server
        time.sleep(1)  # Increased delay since we're making 2 calls per page
    
    return all_records

def save_to_excel(records):
    """Save records to Excel file with specific columns and formatting"""
    if not records:
        print("No records to save.")
        return
    
    # Process records to extract required fields
    processed_records = []
    
    for record in records:
        try:
            # Parse withdrawRequest JSON
            withdraw_request = {}
            if record.get('withdrawRequest'):
                try:
                    withdraw_request = json.loads(record['withdrawRequest'])
                except json.JSONDecodeError:
                    print(f"Warning: Could not parse withdrawRequest for record: {record.get('withdrawId', 'Unknown')}")
            
            # Map status codes to descriptions
            status_mapping = {
                4: "Succeeded",
                3: "Failed", 
                2: "Processing"
            }
            status_text = status_mapping.get(record.get('status'), f"Unknown ({record.get('status')})")
              # Create processed record with required columns
            processed_record = {
                'Date': record.get('created', ''),
                'Success Date': record.get('modified', ''),
                'Amount': record.get('amount', 0),
                'Withdraw Id': record.get('withdrawId', ''),
                'UTR': record.get('utr') if record.get('utr') is not None else '',
                'Account Number': withdraw_request.get('bankAccountNumber', ''),
                'Account Holder Name': withdraw_request.get('bankAccountHolderName', ''),
                'IFSC Code': withdraw_request.get('bankAccountIfscCode', ''),
                'Status': status_text
            }
            
            processed_records.append(processed_record)
            
        except Exception as e:
            print(f"Error processing record: {e}")
            continue
    
    # Create DataFrame from processed records
    df = pd.DataFrame(processed_records)
    
    # Reorder columns to match your specification
    column_order = [
        'Date', 
        'Success Date', 
        'Amount', 
        'Withdraw Id', 
        'UTR', 
        'Account Number', 
        'Account Holder Name', 
        'IFSC Code', 
        'Status'
    ]
    df = df[column_order]
    
    # Generate filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"withdrawal_data_formatted_{timestamp}.xlsx"
    filepath = os.path.join(os.getcwd(), filename)
    
    # Save to Excel
    df.to_excel(filepath, index=False, sheet_name="Withdrawal Records")
    
    print(f"Data saved to: {filepath}")
    print(f"Total records saved: {len(processed_records)}")
    
    # Display some basic statistics
    print(f"\nData Summary:")
    print(f"Columns: {list(df.columns)}")
    if not df.empty:
        print(f"Date range: {df['Date'].min()} to {df['Date'].max()}")
        print(f"Total amount: {df['Amount'].sum():,.2f}")
        print(f"Status distribution:")
        print(df['Status'].value_counts())
        print(f"Average amount: {df['Amount'].mean():,.2f}")
        print(f"Records with UTR: {df[df['UTR'] != ''].shape[0]}")
        print(f"Records with Account Number: {df[df['Account Number'] != ''].shape[0]}")

def main():
    """Main function to execute the complete workflow"""
    print("Starting API scraping process...")
    print("This will call both APIs for each page (68 pages total)")
    print("=" * 50)
    
    # Note: We no longer call producer API here since it's called for each page
    print("Fetching withdrawal data (calling producer API before each page)...")
    records = fetch_withdraw_data()
    
    print("\n" + "=" * 50)
    
    # Save to Excel
    print("Saving data to Excel...")
    save_to_excel(records)
    
    print("\n" + "=" * 50)
    print("Process completed!")

if __name__ == "__main__":
    main()
