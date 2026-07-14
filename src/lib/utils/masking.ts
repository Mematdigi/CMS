interface MaskableLead {
  phone?: string | null;
  altPhone?: string | null;
  email?: string | null;
  state?: string | null;
  city?: string | null;
  country?: string | null;
  [key: string]: unknown;
}

export function maskLead<T>(lead: T, role: string): T {
  if (!lead) return lead;
  
  // Apply masking for SALES_EXECUTIVE and VIEWER roles
  if (role === "SALES_EXECUTIVE" || role === "VIEWER") {
    const masked = { ...lead } as unknown as MaskableLead;
    
    if (masked.phone) {
      // Show only last 4 digits, replace rest with '*'
      const cleanPhone = masked.phone.replace(/\s+/g, "");
      if (cleanPhone.length > 4) {
        masked.phone = `+1 (555) ***-${cleanPhone.slice(-4)}`;
      } else {
        masked.phone = "+1 (555) ***-****";
      }
    }
    
    if (masked.altPhone) {
      masked.altPhone = "[Hidden]";
    }
    
    if (masked.email) {
      // Mask email domain/name prefix
      const parts = masked.email.split("@");
      if (parts.length === 2) {
        const name = parts[0];
        const domain = parts[1];
        masked.email = `${name.charAt(0)}***@${domain}`;
      } else {
        masked.email = "***@enterprise.com";
      }
    }
    
    if (masked.state) masked.state = "[Hidden]";
    if (masked.city) masked.city = "[Hidden]";
    if (masked.country) masked.country = "[Hidden]";
    
    return masked as unknown as T;
  }
  
  return lead;
}

export function maskLeadsArray<T>(leads: T[], role: string): T[] {
  if (!leads) return [];
  return leads.map((lead) => maskLead(lead, role));
}
