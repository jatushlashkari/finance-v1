# Visual Guide: Download Statement Feature

## 1. Account Details Page - New Button

When viewing an account's details, you'll now see a **"Download Statement"** button in the header:

```
┌─────────────────────────────────────────────────────────────────┐
│ [← Back to Accounts]    Account Details    [📥 Download Statement]│
└─────────────────────────────────────────────────────────────────┘
```

### Button States:

**Normal State:**
- Green background with white text
- Shows "Download Statement" on larger screens
- Shows "Statement" on mobile devices
- Download icon visible

**Loading State:**
- Spinning loader animation
- Shows "Loading..." text
- Button is disabled

**Disabled State:**
- Appears when there are no successful transactions
- Gray/muted appearance
- Not clickable

## 2. Statement Modal

When you click "Download Statement", a modal appears with:

### Header Section
```
┌─────────────────────────────────────────────────────────────────┐
│  📄 Account Statement                    [Download PDF] [Close]  │
│     Successful Transactions Only                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Statement Content

```
═══════════════════════════════════════════════════════════════════
                    ACCOUNT STATEMENT
                Transaction Summary Report
              ✓ Successful Transactions Only
                                                  Statement Date:
                                                  October 7, 2025
═══════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│                    ACCOUNT INFORMATION                          │
├─────────────────────────────────────────────────────────────────┤
│ Account Holder Name: John Doe                                   │
│ Account Number: 1234567890                                      │
│ Statement Period: 01-Jan-2024 to 07-Oct-2025                  │
│ Total Successful Transactions: 50                              │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┬──────────────────┬──────────────────────────┐
│ Total Success    │ Average Trans.   │ Transaction Count        │
│ Amount           │                  │                          │
├──────────────────┼──────────────────┼──────────────────────────┤
│ ₹1,25,000        │ ₹2,500           │ 50                       │
└──────────────────┴──────────────────┴──────────────────────────┘

                     TRANSACTION DETAILS
┌────────────┬──────────────┬──────────┬──────────┬────────────┐
│ Date       │ Withdraw ID  │ UTR      │ Amount   │ Source     │
├────────────┼──────────────┼──────────┼──────────┼────────────┤
│ 05-Oct-25  │ WD123456     │ UTR001   │ ₹2,500   │ DOA6PS     │
│ 08:30 AM   │              │          │          │            │
├────────────┼──────────────┼──────────┼──────────┼────────────┤
│ 03-Oct-25  │ WD123457     │ UTR002   │ ₹3,000   │ FWXEQK     │
│ 02:15 PM   │              │          │          │            │
├────────────┼──────────────┼──────────┼──────────┼────────────┤
│ ...        │ ...          │ ...      │ ...      │ ...        │
└────────────┴──────────────┴──────────┴──────────┴────────────┘

                          GRAND TOTAL
┌─────────────────────────────────────────────────────────────────┐
│ Total Transactions: 50                                          │
│ Grand Total: ₹1,25,000                                          │
└─────────────────────────────────────────────────────────────────┘

─────────────────────────────────────────────────────────────────
Statement Notes:
• This statement includes only successful transactions.
• All amounts are shown in Indian Rupees (INR).
• Transaction dates are displayed in DD-MMM-YYYY format.
• This is a system-generated statement and does not require a signature.

Statement generated on October 7, 2025, 10:30 AM • Digital Statement
This is a computer-generated document. No signature is required.
─────────────────────────────────────────────────────────────────
```

## 3. User Flow

### Step-by-Step Process:

1. **Navigate to Accounts Page**
   - Click "Account Overview" from the dashboard

2. **Select an Account**
   - Click on any account card to view its details

3. **View Account Details**
   - See transaction history with all transactions (success, failed, processing)
   - Note the "Download Statement" button in the header

4. **Generate Statement**
   - Click "Download Statement" button
   - System fetches only successful transactions
   - Modal appears with statement preview

5. **Review Statement**
   - Check account information
   - Review transaction summary
   - Verify transaction details

6. **Download PDF**
   - Click "Download PDF" button in modal
   - PDF is generated and downloaded automatically
   - File name format: `statement_[accountNumber]_[date].pdf`
   - Example: `statement_1234567890_2025-10-07.pdf`

## 4. Key Features

### Filtering
- ✅ Only successful transactions are included
- ❌ Failed transactions are excluded
- ❌ Processing transactions are excluded

### Professional Layout
- Clean, invoice-style design
- Clear sections for different information
- Professional typography and spacing
- Color-coded summary cards

### Comprehensive Information
- Account holder details
- Date range of transactions
- Statistical summaries
- Individual transaction details
- Grand totals

### Mobile Responsive
- Adapts to screen size
- Touch-friendly buttons
- Readable on all devices
- Optimized layout for mobile and desktop

## 5. Technical Notes

### Data Sources
- Fetches from both transaction collections:
  - `transactions_doa6ps`
  - `transactions_fwxeqk`

### Performance
- Lazy loading: Only fetches when button is clicked
- Efficient filtering: Server-side filtering for successful transactions
- Pagination: Handles large transaction volumes

### Error Handling
- Shows alert if fetch fails
- Button disabled if no successful transactions
- Loading states during data fetch
- Graceful error recovery

## 6. Use Cases

### For Users
- Monthly/quarterly reports
- Tax documentation
- Record keeping
- Financial auditing
- Sharing with accountants

### For Businesses
- Client reports
- Financial statements
- Transaction verification
- Compliance documentation
- Audit trails
