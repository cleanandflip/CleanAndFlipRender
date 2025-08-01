// Server-side export utility functions

export function generateCSV(submissions: any[]): string {
  const headers = [
    'Reference Number',
    'Equipment Name', 
    'Brand',
    'Condition',
    'Asking Price',
    'Status',
    'User Name',
    'Email',
    'Phone',
    'Created Date',
    'Location',
    'Is Local'
  ];
  
  const rows = submissions.map(s => [
    s.referenceNumber || '',
    s.name || s.equipmentName || '',
    s.brand || '',
    s.condition || '',
    s.askingPrice ? `$${s.askingPrice}` : 'Open',
    s.status || '',
    s.user?.name || s.userName || '',
    s.user?.email || s.userEmail || '',
    s.phoneNumber || '',
    new Date(s.createdAt).toLocaleDateString(),
    [s.userCity, s.userState].filter(Boolean).join(', '),
    s.isLocal ? 'Yes' : 'No'
  ]);
  
  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');
}

export function convertSubmissionsToCSV(submissions: any[]): string {
  return generateCSV(submissions);
}

export function generatePDFData(submissions: any[]) {
  return {
    title: 'Equipment Submissions Report',
    subtitle: `Generated on ${new Date().toLocaleDateString()}`,
    headers: [
      'Reference', 'Equipment', 'Brand', 'Condition', 'Status', 'User', 'Date'
    ],
    data: submissions.map(s => [
      s.referenceNumber,
      s.name || s.equipmentName,
      s.brand,
      s.condition,
      s.status,
      s.user?.name || s.userName,
      new Date(s.createdAt).toLocaleDateString()
    ]),
    summary: {
      total: submissions.length,
      pending: submissions.filter(s => s.status === 'pending').length,
      completed: submissions.filter(s => s.status === 'completed').length,
      rejected: submissions.filter(s => s.status === 'rejected').length
    }
  };
}