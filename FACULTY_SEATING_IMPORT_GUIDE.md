# 📍 Faculty Seating Import Feature

## ✅ New Feature Added!

Faculty seating details can now be imported via Excel file in the **Admin Panel → Faculty Seating** section.

### 📋 Import Process:

1. **Login as Admin** (admin@cuchd.in / admin@123)
2. Go to **"Faculty Seating"** from sidebar
3. Click **"Download Template"** button
4. Fill the Excel template with faculty details
5. Click **"Import Excel"** and upload the file
6. View import summary

### 📊 Excel Template Format:

The template includes these columns:

| Name | Email | ECode | Department | Seating | Mobile |
|------|-------|-------|------------|---------|--------|
| Dr. John Doe | john.doe@cumail.in | FAC001 | CS | 510 | 9876543210 |
| Prof. Jane Smith | jane.smith@cumail.in | FAC002 | Mathematics | 611 | 9876543211 |

### 📝 Field Details:

- **Name**: Faculty member's full name (Required)
- **Email**: Email address (Required, must be unique)
- **ECode**: Employee code/ID (Optional)
- **Department**: Department name (CS, Mathematics, etc.)
- **Seating**: Room number (e.g., 510, 611)
- **Mobile**: Contact number (10 digits)

### ⏰ Auto-Set Values:

When you import faculty, the system automatically sets:

- **Available Days**: Monday to Friday
- **Available Time**: 9:30 AM - 4:30 PM
- **Building**: Academic Block
- **Floor**: Auto-detected from room number (first digit)
- **Status**: Available

### 🎯 What Happens During Import:

1. **New Faculty**: If email doesn't exist, creates:
   - New faculty user account
   - Faculty seating entry
   - Default password: `faculty@123`

2. **Existing Faculty**: If email exists, updates:
   - Seating information
   - Contact details
   - Room assignment

### 📍 Display Features:

**Admin View:**
- Import/Export functionality
- Download template
- View all faculty seats
- Floor-wise grouping
- Import summary (added/updated counts)

**Student/Faculty View:**
- Interactive faculty map
- Floor filter
- Faculty details with:
  - Name, Department, Room
  - Availability status
  - Available days (Monday to Friday)
  - Available time (9:30 AM - 4:30 PM)
  - Contact number

### ✨ Benefits:

✅ Bulk import faculty seating details
✅ Auto-creates faculty accounts if needed
✅ Updates existing records
✅ Validates data during import
✅ Shows detailed import summary
✅ Standardized availability schedule
✅ Easy to maintain and update

### 🔄 Update Process:

To update faculty seating:
1. Download current template
2. Make changes to Excel file
3. Re-import the file
4. System will update existing records

### 📱 Mobile Responsive:

The faculty map works perfectly on:
- Desktop/Laptop
- Tablets
- Mobile phones

All faculty details are displayed with proper formatting!
