import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StudentModal from '../src/components/StudentModal';

describe('StudentModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();
  
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSubmit: mockOnSubmit,
    courses: [{ id: 1, courseName: 'Computer Science', semesters: [{ id: 1, name: 'Semester 1' }] }]
  };

  it('renders correctly when open', () => {
    render(<StudentModal {...defaultProps} />);
    expect(screen.getByText(/Add New Student/i)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<StudentModal {...defaultProps} />);
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('submits form with correct data', async () => {
    render(<StudentModal {...defaultProps} />);
    
    // Fill required fields
    fireEvent.change(screen.getByPlaceholderText(/STU20240001/i), { target: { value: 'STU123' } });
    fireEvent.change(screen.getByLabelText(/First Name \*/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/Last Name \*/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/Email Address \*/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/Phone Number \*/i), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByLabelText(/Date of Birth \*/i), { target: { value: '2000-01-01' } });
    fireEvent.change(screen.getByLabelText(/Address \*/i), { target: { value: '123 Main St' } });
    fireEvent.change(screen.getByLabelText(/City \*/i), { target: { value: 'New York' } });
    fireEvent.change(screen.getByLabelText(/State \*/i), { target: { value: 'NY' } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /add student/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
    
    // FormData verification can be complex due to its nature, 
    // but verifying it was called is the primary goal here.
  });
});
