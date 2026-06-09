import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('Starting customer migration...');
  
  // 1. Get all service orders without customer_id
  const { data: orders, error: ordersError } = await supabase
    .from('service_orders')
    .select('id, tenant_id, device_info')
    .is('customer_id', null);

  if (ordersError) {
    console.error('Error fetching orders:', ordersError);
    return;
  }

  console.log(`Found ${orders?.length} orders without customer_id`);

  for (const order of orders || []) {
    const deviceInfo = order.device_info as Record<string, any>;
    const name = deviceInfo?.customer_name;
    const phone = deviceInfo?.customer_phone;
    const email = deviceInfo?.customer_email;
    const tenantId = order.tenant_id;

    if (!name && !phone) continue;

    // Try to find existing customer
    let query = supabase
      .from('customers')
      .select('id')
      .eq('tenant_id', tenantId);
    
    if (phone) {
      query = query.eq('phone', phone);
    } else if (name) {
      query = query.eq('full_name', name);
    }

    const { data: existingCustomers } = await query.limit(1);

    let customerId = null;

    if (existingCustomers && existingCustomers.length > 0) {
      customerId = existingCustomers[0].id;
    } else {
      // Create new customer
      const { data: newCustomer, error: createError } = await supabase
        .from('customers')
        .insert({
          tenant_id: tenantId,
          full_name: name || 'Cliente Sin Nombre',
          phone: phone || null,
          email: email || null,
          tag: 'importado'
        })
        .select('id')
        .single();

      if (createError) {
        console.error(`Failed to create customer for order ${order.id}`, createError);
        continue;
      }
      customerId = newCustomer.id;
    }

    // Update order
    const { error: updateError } = await supabase
      .from('service_orders')
      .update({ customer_id: customerId })
      .eq('id', order.id);

    if (updateError) {
      console.error(`Failed to update order ${order.id}`, updateError);
    } else {
      console.log(`Updated order ${order.id} with customer ${customerId}`);
    }
  }

  console.log('Migration completed.');
}

runMigration().catch(console.error);
