/**
 * Quick Test Data Script
 * Run this in your browser console (F12 → Console tab) while logged in as a guest
 * to create properly seeded test data for testing the Date Change functionality
 */

// 1. First, let's check if you're logged in
const checkAuth = async () => {
    const { data: { session } } = await window.supabase.auth.getSession();
    if (!session) {
        console.error('❌ Not logged in! Please log in first.');
        return null;
    }
    console.log('✅ Logged in as:', session.user.email);
    return session.user.id;
};

// 2. Create a test lease with actual dates
const createTestLease = async (userId) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // Started 1 week ago

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 84); // 12-week lease

    const { data: lease, error } = await window.supabase
        .from('bookings_leases')
        .insert({
            'Agreement Number': 'TEST-' + Date.now(),
            'Guest': userId,
            'Host': 'host-user-id', // Replace with actual host ID
            'Listing': 'test-listing-id', // Replace with actual listing ID
            'Reservation Period : Start': startDate.toISOString(),
            'Reservation Period : End': endDate.toISOString(),
            'Lease Status': 'Active',
            'Total Rent': 7500
        })
        .select()
        .single();

    if (error) {
        console.error('❌ Error creating lease:', error);
        return null;
    }

    console.log('✅ Created test lease:', lease._id);
    return lease;
};

// 3. Create stays for the lease
const createTestStays = async (leaseId, startDate) => {
    const stays = [];

    // Create 12 weekly stays
    for (let week = 0; week < 12; week++) {
        const stayStart = new Date(startDate);
        stayStart.setDate(stayStart.getDate() + (week * 7));

        const stayEnd = new Date(stayStart);
        stayEnd.setDate(stayEnd.getDate() + 7);

        const now = new Date();
        let status = 'Upcoming';
        if (stayEnd < now) status = 'Completed';
        else if (stayStart <= now && stayEnd >= now) status = 'Active';

        stays.push({
            'Lease': leaseId,
            'Start': stayStart.toISOString(),
            'End': stayEnd.toISOString(),
            'Status': status
        });
    }

    const { data, error } = await window.supabase
        .from('calendar_stays')
        .insert(stays)
        .select();

    if (error) {
        console.error('❌ Error creating stays:', error);
        return null;
    }

    console.log('✅ Created', data.length, 'stays');
    return data;
};

// 4. Run the full setup
const setupTestData = async () => {
    console.log('🚀 Setting up test data...');

    const userId = await checkAuth();
    if (!userId) return;

    const lease = await createTestLease(userId);
    if (!lease) return;

    await createTestStays(lease._id, lease['Reservation Period : Start']);

    console.log('✅ Test data setup complete! Refresh the page to see your new lease.');
};

// Run it!
setupTestData();
