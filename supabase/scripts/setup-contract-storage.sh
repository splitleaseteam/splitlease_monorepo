#!/bin/bash
# Contract Templates Storage Setup Script
# Date: 2026-01-28
# Purpose: Execute storage setup migration

set -e

echo "=== Contract Templates Storage Setup ==="
echo ""

# Check if supabase is available
if ! command -v supabase &> /dev/null; then
    echo "Error: supabase CLI not found. Please install it first:"
    echo "  npm install -g supabase"
    exit 1
fi

# Check if supabase is started
if ! supabase status &> /dev/null; then
    echo "Starting Supabase local environment..."
    supabase start
fi

echo "Executing storage setup migration..."
supabase db execute --file=supabase/migrations/20260128_contract_templates_storage_setup.sql

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next Steps:"
echo "1. Upload template files to Supabase Storage:"
echo "   - recurringcreditcardauthorizationprorated.docx"
echo "   - recurringcreditcardauthorization.docx"
echo "   - hostpayoutscheduleform.docx"
echo "   - periodictenancyagreement.docx"
echo "   - supplementalagreement.docx"
echo ""
echo "2. Access the storage dashboard to upload files:"
echo "   supabase storage open --bucket contract-templates"
echo ""
echo "3. Test the lease-documents Edge Function:"
echo "   curl -X POST http://localhost:54321/functions/v1/lease-documents \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"action\": \"generate_host_payout\", \"payload\": {\"Agreement Number\": \"AGR-TEST-001\", \"Date1\": \"2024-01-15\", \"Rent1\": \"\$1000\", \"Total1\": \"\$1100\"} }'"
echo ""
