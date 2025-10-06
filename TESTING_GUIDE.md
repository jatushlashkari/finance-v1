# Testing Guide: Account Statement PDF Feature

## Prerequisites
- Development server running (`npm run dev`)
- Access to the application at `http://localhost:3000`
- At least one account with successful transactions in the database

## Test Scenarios

### Test 1: Basic Statement Generation
**Objective:** Verify that the statement can be generated and downloaded

**Steps:**
1. Navigate to http://localhost:3000/accounts
2. Click on any account that has successful transactions
3. On the account details page, verify the "Download Statement" button is visible and enabled
4. Click "Download Statement"
5. Wait for the modal to appear
6. Verify the modal shows:
   - Account information (name, number)
   - Statement period
   - Summary statistics
   - Transaction list
7. Click "Download PDF"
8. Verify PDF is downloaded with filename format: `statement_[accountNumber]_[date].pdf`

**Expected Result:**
- Statement modal opens successfully
- All data is displayed correctly
- PDF downloads successfully
- PDF contains all statement information

---

### Test 2: Button States
**Objective:** Verify button behavior in different states

**Steps:**
1. Navigate to an account with NO successful transactions
2. Verify "Download Statement" button is disabled (gray/muted)
3. Navigate to an account WITH successful transactions
4. Verify "Download Statement" button is enabled (green)
5. Click "Download Statement"
6. During loading, verify button shows:
   - Spinning loader
   - "Loading..." text
   - Button is disabled

**Expected Result:**
- Button correctly reflects account state
- Loading state is visible
- User cannot spam-click the button

---

### Test 3: API Endpoint
**Objective:** Test the new API endpoint directly

**Steps:**
1. Open browser console or use a tool like Postman
2. Make a GET request to: `/api/transactions/account/[ACCOUNT_NUMBER]/successful`
3. Replace `[ACCOUNT_NUMBER]` with a valid account number (e.g., `0280101016789`)
4. Verify response contains:
   ```json
   {
     "success": true,
     "transactions": [...],
     "total": 50,
     "totalAmount": 125000,
     "accountNumber": "0280101016789"
   }
   ```
5. Verify all transactions have `status: "Succeeded"`

**Expected Result:**
- API returns successful response
- Only successful transactions are included
- Transactions are sorted by date (newest first)

---

### Test 4: Statement Content Accuracy
**Objective:** Verify statement contains accurate information

**Steps:**
1. Note down the account details:
   - Account holder name
   - Account number
   - Number of successful transactions
   - Total success amount (from account overview)
2. Open the statement
3. Compare the information:
   - Account holder name matches
   - Account number matches
   - Transaction count matches
   - Total amount matches
4. Spot-check 3-5 individual transactions:
   - Date is correct
   - Amount is correct
   - Withdraw ID is correct
   - UTR is correct (if available)

**Expected Result:**
- All information matches the source data
- Calculations are accurate
- No data discrepancies

---

### Test 5: Multiple Transaction Sources
**Objective:** Verify statement includes transactions from both collections

**Steps:**
1. Find an account that has transactions from both sources:
   - `doa6ps`
   - `fwxeqk`
2. Open the statement for this account
3. Check the "Source" column in the transaction table
4. Verify both sources are represented
5. Verify transactions are properly sorted by date (not by source)

**Expected Result:**
- Transactions from both collections are included
- Proper source labeling
- Correct chronological ordering

---

### Test 6: Large Transaction Volume
**Objective:** Test performance with many transactions

**Steps:**
1. Find an account with 50+ successful transactions
2. Click "Download Statement"
3. Note the loading time
4. Verify the modal opens without freezing
5. Scroll through the transaction list
6. Generate the PDF
7. Open the PDF and verify all pages are correct

**Expected Result:**
- Loading completes within 2-3 seconds
- Modal scrolls smoothly
- PDF generation completes successfully
- Multi-page PDF renders correctly

---

### Test 7: Mobile Responsiveness
**Objective:** Test on mobile devices

**Steps:**
1. Open the app on a mobile device or use browser dev tools (F12 → Device toolbar)
2. Navigate to an account
3. Verify "Download Statement" button shows "Statement" text (shortened)
4. Click the button
5. Verify modal is readable and scrollable on mobile
6. Test PDF download on mobile
7. Verify PDF opens correctly on mobile

**Expected Result:**
- Button text adapts to screen size
- Modal is mobile-friendly
- PDF downloads on mobile devices
- PDF is readable on mobile

---

### Test 8: Error Handling
**Objective:** Test error scenarios

**Steps:**
1. **Scenario A: Network Error**
   - Open browser dev tools → Network tab
   - Set network to "Offline"
   - Try to download statement
   - Verify error alert appears
   
2. **Scenario B: No Successful Transactions**
   - Navigate to account with only failed transactions
   - Verify "Download Statement" button is disabled
   - Verify button tooltip (if hovering)

3. **Scenario C: API Error**
   - Temporarily break the API (rename the route file)
   - Try to download statement
   - Verify error alert appears
   - Restore the API

**Expected Result:**
- Appropriate error messages
- No app crashes
- User can recover from errors

---

### Test 9: PDF Quality
**Objective:** Verify PDF output quality

**Steps:**
1. Generate and download a statement PDF
2. Open the PDF
3. Check:
   - Text is readable (not blurry)
   - Tables are aligned
   - Colors are preserved
   - Borders are clean
   - Page breaks are appropriate
4. Print the PDF (or print preview)
5. Verify print quality

**Expected Result:**
- High-quality PDF output
- Professional appearance
- Print-ready document

---

### Test 10: Concurrent Usage
**Objective:** Test multiple statement downloads

**Steps:**
1. Open the statement for Account A
2. Download PDF for Account A
3. Close the modal
4. Immediately open statement for Account B
5. Verify Account B's data (not Account A's)
6. Download PDF for Account B
7. Compare both PDFs
8. Verify they contain different data

**Expected Result:**
- Each statement contains correct data
- No data mixing between accounts
- PDFs are correctly named

---

## Browser Compatibility Testing

Test the feature in:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile Safari (iOS)
- ✅ Chrome Mobile (Android)

## Performance Benchmarks

Expected performance:
- **API call:** < 1 second for 100 transactions
- **Modal render:** < 500ms
- **PDF generation:** < 3 seconds for 100 transactions
- **File size:** ~200-500KB per statement

## Known Limitations

1. Very large statements (500+ transactions) may take longer to generate
2. PDF quality depends on browser's canvas rendering
3. Print dialog may vary by browser
4. Mobile download behavior varies by OS

## Regression Testing

After any code changes, re-test:
1. Individual transaction invoice download (existing feature)
2. Account listing and search
3. Account details page
4. Transaction pagination
5. Bookmark functionality

## Bug Reporting Template

If you find an issue, report with:
```
**Issue:** Brief description
**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3
**Expected:** What should happen
**Actual:** What actually happened
**Browser:** Chrome 118.0
**Account Number:** 1234567890
**Screenshots:** [Attach if applicable]
**Console Errors:** [Paste any errors]
```

## Success Criteria

Feature is ready for production when:
- ✅ All test scenarios pass
- ✅ No console errors
- ✅ Works on all supported browsers
- ✅ Mobile responsive
- ✅ Performance is acceptable
- ✅ No data accuracy issues
- ✅ Error handling works correctly
- ✅ PDFs are high quality
