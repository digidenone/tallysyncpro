// Template generator for Excel files
export function generateExcelTemplate(templateType, customFields = []) {
  const baseTemplates = {
    sales: {
      name: 'Sales Invoice Template',
      columns: [
        { name: 'Supplier invoice no', key: 'supplierInvoiceNo', type: 'string', required: true, example: 'Sale/11' },
        { name: 'Date ', key: 'date', type: 'date', required: true, example: '2024-04-01' },
        { name: 'To ( Party Name )', key: 'partyName', type: 'string', required: true, example: 'A B MEDICAL STORES' },
        { name: 'Purchase 5%', key: 'purchase5', type: 'number', required: false, example: '100' },
        { name: 'Purchase 12%', key: 'purchase12', type: 'number', required: false, example: '100' },
        { name: 'Purchase 18%', key: 'purchase18', type: 'number', required: false, example: '100' },
        { name: 'CGST', key: 'cgst', type: 'number', required: false, example: '17.5' },
        { name: 'SGST', key: 'sgst', type: 'number', required: false, example: '17.5' },
        { name: 'TOTAL', key: 'total', type: 'number', required: true, example: '335' },
        { name: 'Narration', key: 'narration', type: 'string', required: false, example: 'being Medicine sale' }
      ]
    },
    purchase: {
      name: 'Purchase Invoice Template',
      columns: [
        { name: 'Supplier invoice no', key: 'supplierInvoiceNo', type: 'string', required: true, example: 'AV/10' },
        { name: 'Date ', key: 'date', type: 'date', required: true, example: '2024-04-01' },
        { name: 'To ( Party Name )', key: 'partyName', type: 'string', required: true, example: 'AAKANSHA SUPER MARKET' },
        { name: 'Purchase 5%', key: 'purchase5', type: 'number', required: false, example: '100' },
        { name: 'Purchase 12%', key: 'purchase12', type: 'number', required: false, example: '100' },
        { name: 'Purchase 18%', key: 'purchase18', type: 'number', required: false, example: '100' },
        { name: 'CGST', key: 'cgst', type: 'number', required: false, example: '17.5' },
        { name: 'SGST', key: 'sgst', type: 'number', required: false, example: '17.5' },
        { name: 'TOTAL', key: 'total', type: 'number', required: true, example: '335' },
        { name: 'Narration', key: 'narration', type: 'string', required: false, example: 'Being the Medicine Purchase in credit' }
      ]
    },
    journal: {
      name: 'Journal Voucher Template',
      columns: [
        { name: 'Supplier invoice no', key: 'supplierInvoiceNo', type: 'string', required: true, example: 'AV/10' },
        { name: 'Date ', key: 'date', type: 'date', required: true, example: '2024-04-01' },
        { name: 'To ( Party Name )', key: 'partyName', type: 'string', required: true, example: 'AAKANSHA SUPER MARKET' },
        { name: 'Purchase 5%', key: 'purchase5', type: 'number', required: false, example: '100' },
        { name: 'Purchase 12%', key: 'purchase12', type: 'number', required: false, example: '100' },
        { name: 'Purchase 18%', key: 'purchase18', type: 'number', required: false, example: '100' },
        { name: 'CGST', key: 'cgst', type: 'number', required: false, example: '17.5' },
        { name: 'SGST', key: 'sgst', type: 'number', required: false, example: '17.5' },
        { name: 'TOTAL', key: 'total', type: 'number', required: true, example: '335' },
        { name: 'Narration', key: 'narration', type: 'string', required: false, example: 'Being the Medicine Purchase in credit' }
      ]
    },
    bank: {
      name: 'Bank Voucher Template',
      columns: [
        { name: 'Date*', key: 'date', type: 'date', required: true, example: '2024-04-01' },
        { name: 'Vch Type*', key: 'vchType', type: 'string', required: true, example: 'Receipt' },
        { name: 'Narration', key: 'narration', type: 'string', required: false, example: 'TRAN DATE -(MMDD) 0401 TRAN TIME - (HHMMSS) 19564' },
        { name: 'Cheque No.', key: 'chequeNo', type: 'string', required: false, example: '123456' },
        { name: 'Ledger*', key: 'ledger', type: 'string', required: true, example: 'A B MEDICAL STORES' },
        { name: 'DR/CR', key: 'drCr', type: 'string', required: false, example: 'Dr' },
        { name: 'Single Amount', key: 'singleAmount', type: 'number', required: false, example: '1000' },
        { name: 'Withdrawal*', key: 'withdrawal', type: 'number', required: false, example: '0' },
        { name: 'Deposit*', key: 'deposit', type: 'number', required: false, example: '100000' }
      ]
    },
    payment: {
      name: 'Payment Voucher Template',
      columns: [
        { name: 'Date*', key: 'date', type: 'date', required: true, example: '2024-04-01' },
        { name: 'Vch Type*', key: 'vchType', type: 'string', required: true, example: 'Payment' },
        { name: 'Narration', key: 'narration', type: 'string', required: false, example: 'Payment for services' },
        { name: 'Cheque No.', key: 'chequeNo', type: 'string', required: false, example: '123456' },
        { name: 'Ledger*', key: 'ledger', type: 'string', required: true, example: 'Supplier Name' },
        { name: 'DR/CR', key: 'drCr', type: 'string', required: false, example: 'Cr' },
        { name: 'Single Amount', key: 'singleAmount', type: 'number', required: false, example: '5000' },
        { name: 'Withdrawal*', key: 'withdrawal', type: 'number', required: false, example: '5000' },
        { name: 'Deposit*', key: 'deposit', type: 'number', required: false, example: '0' }
      ]
    },
    receipt: {
      name: 'Receipt Voucher Template',
      columns: [
        { name: 'Date*', key: 'date', type: 'date', required: true, example: '2024-04-01' },
        { name: 'Vch Type*', key: 'vchType', type: 'string', required: true, example: 'Receipt' },
        { name: 'Narration', key: 'narration', type: 'string', required: false, example: 'Payment received from customer' },
        { name: 'Cheque No.', key: 'chequeNo', type: 'string', required: false, example: '123456' },
        { name: 'Ledger*', key: 'ledger', type: 'string', required: true, example: 'Customer Name' },
        { name: 'DR/CR', key: 'drCr', type: 'string', required: false, example: 'Dr' },
        { name: 'Single Amount', key: 'singleAmount', type: 'number', required: false, example: '10000' },
        { name: 'Withdrawal*', key: 'withdrawal', type: 'number', required: false, example: '0' },
        { name: 'Deposit*', key: 'deposit', type: 'number', required: false, example: '10000' }
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
