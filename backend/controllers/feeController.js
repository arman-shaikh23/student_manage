const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { validationResult } = require('express-validator');

// @desc    Get all fees
// @route   GET /api/fees
const getFees = async (req, res) => {
  try {
    const where = {};
    if (req.user.role === 'STUDENT') {
      const studentRecord = await prisma.student.findUnique({ where: { userId: req.user.id } });
      if (!studentRecord) return res.status(404).json({ success: false, message: 'Student profile not found' });
      where.studentId = studentRecord.id;
    }

    const fees = await prisma.fee.findMany({
      where,
      include: {
        student: { select: { studentId: true, firstName: true, lastName: true, course: { select: { courseName: true } } } },
      },
    });
    res.json({ success: true, data: fees });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Add a payment to a fee record
// @route   POST /api/fees/:feeId/payments
const addPayment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const { amount, paymentMode, transactionId } = req.body;
    const feeId = parseInt(req.params.feeId);
    
    const fee = await prisma.fee.findUnique({ where: { id: feeId } });
    if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found' });

    if (fee.paidFee + amount > fee.totalFee) {
      return res.status(400).json({ success: false, message: 'Payment exceeds remaining balance' });
    }

    const result = await prisma.$transaction(async (prismaClient) => {
      const payment = await prismaClient.payment.create({
        data: {
          feeId,
          amount: parseFloat(amount),
          paymentMode,
          transactionId,
        },
      });

      const newPaidFee = fee.paidFee + parseFloat(amount);
      let status = 'Pending';
      if (newPaidFee === fee.totalFee) status = 'Paid';
      else if (newPaidFee > 0) status = 'Partial';

      const updatedFee = await prismaClient.fee.update({
        where: { id: feeId },
        data: { paidFee: newPaidFee, status },
      });

      return { payment, updatedFee };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getFees, addPayment };
