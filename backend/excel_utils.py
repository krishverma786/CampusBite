import pandas as pd
import io
from typing import List, Dict, Any
from fastapi.responses import StreamingResponse
from datetime import datetime

def create_excel_response(data: List[Dict[str, Any]], filename: str, sheet_name: str = "Sheet1"):
    """Create Excel file response from data"""
    df = pd.DataFrame(data)
    
    # Create Excel file in memory
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name=sheet_name, index=False)
    output.seek(0)
    
    # Create response
    headers = {
        'Content-Disposition': f'attachment; filename="{filename}"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
    
    return StreamingResponse(output, headers=headers)

def parse_csv_data(file_content: bytes) -> List[Dict[str, Any]]:
    """Parse CSV file content to list of dicts"""
    try:
        # Try different encodings
        for encoding in ['utf-8', 'latin-1', 'iso-8859-1']:
            try:
                df = pd.read_csv(io.BytesIO(file_content), encoding=encoding)
                # Convert to list of dicts and clean up
                records = df.to_dict('records')
                # Remove NaN values
                cleaned_records = []
                for record in records:
                    cleaned = {k: (v if pd.notna(v) else None) for k, v in record.items()}
                    cleaned_records.append(cleaned)
                return cleaned_records
            except UnicodeDecodeError:
                continue
        raise ValueError("Could not decode CSV file")
    except Exception as e:
        raise ValueError(f"Error parsing CSV: {str(e)}")

def create_student_template() -> StreamingResponse:
    """Create student CSV template"""
    template_data = {
        'Name': ['John Doe', 'Jane Smith'],
        'Email': ['john.doe@example.com', 'jane.smith@example.com'],
        'RollNo': ['24BCS10001', '24BCS10002'],
        'Department': ['CS', 'CS'],
        'Batch': ['2024-28', '2024-28'],
        'Semester': [1, 1]
    }
    return create_excel_response([template_data], "student_template.xlsx", "Students")

def create_faculty_template() -> StreamingResponse:
    """Create faculty CSV template"""
    template_data = {
        'Name': ['Dr. John Doe', 'Prof. Jane Smith'],
        'Email': ['john.doe@cumail.in', 'jane.smith@cumail.in'],
        'EmployeeCode': ['1001', '1002'],
        'Department': ['CS', 'Mathematics'],
        'Room': ['510', '611'],
        'Floor': [5, 6],
        'Mobile': ['9876543210', '9876543211']
    }
    return create_excel_response([template_data], "faculty_template.xlsx", "Faculty")

def export_students_excel(students: List[Dict[str, Any]]) -> StreamingResponse:
    """Export students to Excel"""
    export_data = []
    for s in students:
        export_data.append({
            'Name': s.get('name'),
            'Email': s.get('email'),
            'Department': s.get('dept'),
            'Batch': s.get('batch'),
            'Semester': s.get('semester'),
            'Status': 'Active' if s.get('is_active', True) else 'Inactive'
        })
    
    filename = f"students_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    return create_excel_response(export_data, filename, "Students")

def export_faculty_excel(faculty: List[Dict[str, Any]]) -> StreamingResponse:
    """Export faculty to Excel"""
    export_data = []
    for f in faculty:
        export_data.append({
            'Name': f.get('name'),
            'Email': f.get('email'),
            'Employee Code': f.get('employee_code') or f.get('batch'),
            'Department': f.get('dept'),
            'Room': f.get('room_no'),
            'Mobile': f.get('mobile'),
            'Status': 'Active' if f.get('is_active', True) else 'Inactive'
        })
    
    filename = f"faculty_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    return create_excel_response(export_data, filename, "Faculty")

def export_attendance_excel(attendance_records: List[Dict[str, Any]]) -> StreamingResponse:
    """Export attendance to Excel"""
    export_data = []
    for a in attendance_records:
        export_data.append({
            'Date': a.get('date'),
            'Student Name': a.get('student_name'),
            'Subject': a.get('subject_name'),
            'Session': a.get('session'),
            'Status': a.get('status'),
        })
    
    filename = f"attendance_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    return create_excel_response(export_data, filename, "Attendance")

def export_marks_excel(marks_records: List[Dict[str, Any]]) -> StreamingResponse:
    """Export marks to Excel"""
    export_data = []
    for m in marks_records:
        export_data.append({
            'Student Name': m.get('student_name'),
            'Roll No': m.get('roll_no'),
            'Subject': m.get('subject_name'),
            'Semester': m.get('semester'),
            'Marks': m.get('marks'),
            'Grade': m.get('grade'),
            'Grade Point': m.get('grade_point'),
        })
    
    filename = f"marks_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    return create_excel_response(export_data, filename, "Marks")

def export_cgpa_report_excel(student_data: Dict[str, Any]) -> StreamingResponse:
    """Export student CGPA report to Excel"""
    # Create multiple sheets for comprehensive report
    output = io.BytesIO()
    
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        # Summary sheet
        summary_data = {
            'Student Name': [student_data.get('name')],
            'Email': [student_data.get('email')],
            'Department': [student_data.get('dept')],
            'Batch': [student_data.get('batch')],
            'Current Semester': [student_data.get('semester')],
            'CGPA': [student_data.get('cgpa')],
            'Total Credits': [student_data.get('total_credits')]
        }
        pd.DataFrame(summary_data).to_excel(writer, sheet_name='Summary', index=False)
        
        # Semester-wise grades
        if student_data.get('grades'):
            grades_data = []
            for grade in student_data['grades']:
                grades_data.append({
                    'Semester': grade.get('semester'),
                    'Subject': grade.get('subject_name'),
                    'Code': grade.get('subject_code'),
                    'Credits': grade.get('credits'),
                    'Marks': grade.get('marks'),
                    'Grade': grade.get('grade'),
                    'Grade Point': grade.get('grade_point')
                })
            pd.DataFrame(grades_data).to_excel(writer, sheet_name='Grades', index=False)
    
    output.seek(0)
    
    filename = f"cgpa_report_{student_data.get('name', 'student')}_{datetime.now().strftime('%Y%m%d')}.xlsx"
    headers = {
        'Content-Disposition': f'attachment; filename="{filename}"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
    
    return StreamingResponse(output, headers=headers)
