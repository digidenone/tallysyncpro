// Template generator for Excel files
export function generateExcelTemplate(templateType, customFields = []) {
  const baseTemplates = {
    sales: {
      name: 'Sales Invoice Template',
      columns: [
        { name: 'Date', key: 'date', type: 'date', required: true, example: '2024-01-15' },
        { name: 'Invoice No', key: 'invoiceNo', type: 'string', required: true, example: 'SI001' },
        { name: 'Customer Name', key: 'customer', type: 'string', required: true, example: 'ABC Corp' },
        { name: 'Item Name', key: 'itemName', type: 'string', required: true, example: 'Product A' },
        { name: 'Quantity', key: 'quantity', type: 'number', required: true, example: '10' },
        { name: 'Rate', key: 'rate', type: 'number', required: true, example: '100.00' },
        { name: 'Amount', key: 'amount', type: 'number', required: true, example: '1000.00' },
        { name: 'Tax Rate (%)', key: 'taxRate', type: 'number', required: false, example: '18' },
        { name: 'Tax Amount', key: 'taxAmount', type: 'number', required: false, example: '180.00' },
        { name: 'Total Amount', key: 'totalAmount', type: 'number', required: true, example: '1180.00' }
      ]
    },
    purchase: {
      name: 'Purchase Invoice Template',
      columns: [
        { name: 'Date', key: 'date', type: 'date', required: true, example: '2024-01-15' },
        { name: 'Invoice No', key: 'invoiceNo', type: 'string', required: true, example: 'PI001' },
        { name: 'Supplier Name', key: 'supplier', type: 'string', required: true, example: 'XYZ Suppliers' },
        { name: 'Item Name', key: 'itemName', type: 'string', required: true, example: 'Raw Material A' },
        { name: 'Quantity', key: 'quantity', type: 'number', required: true, example: '50' },
        { name: 'Rate', key: 'rate', type: 'number', required: true, example: '50.00' },
        { name: 'Amount', key: 'amount', type: 'number', required: true, example: '2500.00' },
        { name: 'Tax Rate (%)', key: 'taxRate', type: 'number', required: false, example: '18' },
        { name: 'Tax Amount', key: 'taxAmount', type: 'number', required: false, example: '450.00' },
        { name: 'Total Amount', key: 'totalAmount', type: 'number', required: true, example: '2950.00' }
      ]
    },
    payment: {
      name: 'Payment Voucher Template',
      columns: [
        { name: 'Date', key: 'date', type: 'date', required: true, example: '2024-01-15' },
        { name: 'Voucher No', key: 'voucherNo', type: 'string', required: true, example: 'PV001' },
        { name: 'Party Name', key: 'party', type: 'string', required: true, example: 'ABC Supplier' },
        { name: 'Amount', key: 'amount', type: 'number', required: true, example: '5000.00' },
        { name: 'Payment Mode', key: 'paymentMode', type: 'string', required: true, example: 'Bank Transfer' },
        { name: 'Bank Account', key: 'bankAccount', type: 'string', required: false, example: 'SBI Main Account' },
        { name: 'Reference', key: 'reference', type: 'string', required: false, example: 'Invoice Payment' },
        { name: 'Narration', key: 'narration', type: 'string', required: false, example: 'Payment for services' }
      ]
    },
    receipt: {
      name: 'Receipt Voucher Template',
      columns: [
        { name: 'Date', key: 'date', type: 'date', required: true, example: '2024-01-15' },
        { name: 'Voucher No', key: 'voucherNo', type: 'string', required: true, example: 'RV001' },
        { name: 'Party Name', key: 'party', type: 'string', required: true, example: 'ABC Customer' },
        { name: 'Amount', key: 'amount', type: 'number', required: true, example: '10000.00' },
        { name: 'Receipt Mode', key: 'receiptMode', type: 'string', required: true, example: 'Cash' },
        { name: 'Bank Account', key: 'bankAccount', type: 'string', required: false, example: 'SBI Main Account' },
        { name: 'Reference', key: 'reference', type: 'string', required: false, example: 'Invoice Collection' },
        { name: 'Narration', key: 'narration', type: 'string', required: false, example: 'Payment received' }
      ]
    },
    journal: {
      name: 'Journal Voucher Template',
      columns: [
        { name: 'Date', key: 'date', type: 'date', required: true, example: '2024-01-15' },
        { name: 'Voucher No', key: 'voucherNo', type: 'string', required: true, example: 'JV001' },
        { name: 'Debit Ledger', key: 'debitLedger', type: 'string', required: true, example: 'Office Expenses' },
        { name: 'Credit Ledger', key: 'creditLedger', type: 'string', required: true, example: 'Cash in Hand' },
        { name: 'Amount', key: 'amount', type: 'number', required: true, example: '1000.00' },
        { name: 'Narration', key: 'narration', type: 'string', required: true, example: 'Office supplies purchased' },
        { name: 'Reference', key: 'reference', type: 'string', required: false, example: 'Bill No. 123' }
      ]
    }
  };

  const template = baseTemplates[templateType];
  
  if (!template) {
    throw new Error(`Template type '${templateType}' not found`);
  }

  // Add custom fields if provided
  if (customFields.length > 0) {
    template.columns = [...template.columns, ...customFields];
  }

  // Generate sample data
  const sampleData = template.columns.reduce((obj, col) => {
    obj[col.key] = col.example;
    return obj;
  }, {});

  return {
    ...template,
    sampleData: [sampleData],
    instructions: [
      '1. Fill in your data below the header row',
      '2. Ensure required fields are not empty',
      '3. Use the correct date format (YYYY-MM-DD)',
      '4. Numbers should not contain currency symbols',
      '5. Save as Excel file (.xlsx) when done'
    ]
  };
}
