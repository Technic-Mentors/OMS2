import { Request, Response } from "express";
import pool from "../database/db";

export const addEmployeePayment = async (req: Request, res: Response):Promise <void> => {
  try {
    const { v4: uuidv4 } = await import("uuid");

    const { employeeId, withdrawAmount, paymentMethod, paymentDate } = req.body;

    // Validation
    if (
      !employeeId ||
      withdrawAmount === undefined ||
      !paymentMethod ||
      !paymentDate
    ) {
       res.status(400).json({ message: "All fields are required" }); 
    }

    // Get last balance
    const [lastRecord]: any = await pool.query(
      `SELECT balance FROM employee_accounts WHERE employee_id = ? ORDER BY id DESC LIMIT 1`,
      [employeeId]
    );

    let previousBalance =
      lastRecord.length > 0 ? Number(lastRecord[0].balance) : 0;
    const newBalance = previousBalance - Number(withdrawAmount);

    // Generate invoice
    const invoiceNo = `WIT-${uuidv4().slice(0, 8)}`;

    // Insert payment
    await pool.query(
      `INSERT INTO employee_accounts
       (employee_id, invoice_no, transaction_date, withdraw_amount, refund_amount, balance, payment_method)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(employeeId),
        invoiceNo,
        paymentDate,
        Number(withdrawAmount),
        0,
        newBalance,
        paymentMethod,
      ]
    );

    res.status(201).json({
      message: "Payment withdraw added successfully",
      balance: newBalance,
    });
  } catch (error) {
    console.error("AddPayment Error:", error);
    res.status(500).json({ message: "Failed to add payment withdraw", error });
  }
};

// Add Employee Refund
export const addEmployeeRefund = async (req: Request, res: Response):Promise <void>=> {
  try {
    const { v4: uuidv4 } = await import("uuid");

    const { employeeId, refundAmount, paymentMethod, date } = req.body;

    // Validation
    if (!employeeId || refundAmount === undefined || !paymentMethod || !date) {
      res.status(400).json({ message: "All fields are required" });
    }

    // Get last balance
    const [lastRecord]: any = await pool.query(
      `SELECT balance FROM employee_accounts WHERE employee_id = ? ORDER BY id DESC LIMIT 1`,
      [employeeId]
    );

    let previousBalance =
      lastRecord.length > 0 ? Number(lastRecord[0].balance) : 0;
    const newBalance = previousBalance + Number(refundAmount);

    // Generate invoice
    const invoiceNo = `REF-${uuidv4().slice(0, 8)}`;

    // Insert refund
    await pool.query(
      `INSERT INTO employee_accounts
       (employee_id, invoice_no, transaction_date, withdraw_amount, refund_amount, balance, payment_method)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(employeeId),
        invoiceNo,
        date,
        0,
        Number(refundAmount),
        newBalance,
        paymentMethod,
      ]
    );

    res
      .status(201)
      .json({ message: "Refund added successfully", balance: newBalance });
  } catch (error) {
    console.error("AddRefund Error:", error);
    res.status(500).json({ message: "Failed to add refund", error });
  }
};

export const getEmployeePayments = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT 
        id,
        invoice_no AS invoiceNumber,
        withdraw_amount AS withdrawAmount,
        transaction_date AS date
       FROM employee_accounts
       WHERE employee_id = ? AND withdraw_amount > 0
       ORDER BY transaction_date ASC`,
      [id]
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch payments" });
  }
};

export const getEmployeeRefunds = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT 
        id,
        invoice_no AS invoiceNumber,
        refund_amount AS refundAmount,
        transaction_date AS date
       FROM employee_accounts
       WHERE employee_id = ? AND refund_amount > 0
       ORDER BY transaction_date ASC`,
      [id]
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch refunds" });
  }
};
