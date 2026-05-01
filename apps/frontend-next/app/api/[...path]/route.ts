import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type SupabaseAuth = { access_token?: string; refresh_token?: string };

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function createAuthedClient(token: string) {
  if (!supabaseUrl || !supabaseAnonKey) throw new Error('Supabase environment variables are required');
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { authorization: `Bearer ${token}` } }
  });
}

function createServiceClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY no definido');
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

async function getTenantId(token: string) {
  const client = createAuthedClient(token);
  const { data, error } = await client.auth.getUser(token);
  if (error) throw error;
  const user = data.user;
  const tenantId = user?.user_metadata?.tenant_id || user?.app_metadata?.tenant_id;
  if (!tenantId) throw new Error('No se pudo resolver tenant');
  return String(tenantId);
}

async function getLocalUser(supabase: ReturnType<typeof createAuthedClient>, authUserId: string) {
  if (!authUserId) return null;
  const { data } = await supabase.from('users').select('*').eq('auth_user_id', authUserId).maybeSingle();
  return data || null;
}

async function getLatestSubscription(supabase: ReturnType<typeof createAuthedClient>, tenantId: string) {
  const { data } = await supabase.from('subscriptions').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(1);
  return data?.[0] || null;
}

async function getLatestShop(supabase: ReturnType<typeof createAuthedClient>, tenantId: string) {
  const { data } = await supabase.from('shops').select('*').eq('id', tenantId).maybeSingle();
  return data || null;
}

function parseRange(url: URL) {
  const from = url.searchParams.get('from') || undefined;
  const to = url.searchParams.get('to') || undefined;
  return { from, to };
}

function responseError(message: string, code = 'DOMAIN_ERROR') {
  return NextResponse.json({ success: false, error: { code, message } }, { status: 400 });
}

function pathParts(path: string[]) {
  return path.filter(Boolean);
}

async function jsonResponse(input: PromiseLike<unknown> | unknown, status = 200) {
  return NextResponse.json(await input, { status });
}

async function getPurchaseOrderItems(supabase: ReturnType<typeof createAuthedClient>, orderId: string) {
  const { data } = await supabase.from('purchase_items').select('*').eq('purchase_order_id', orderId).order('created_at', { ascending: true });
  return data || [];
}

async function getServiceOrderTimeline(supabase: ReturnType<typeof createAuthedClient>, serviceOrderId: string) {
  const { data, error } = await supabase.from('service_order_timeline').select('*').eq('service_order_id', serviceOrderId).order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function GET(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const parts = pathParts(path);
  const endpoint = parts.join('/');
  if (endpoint.startsWith('portal/orders/')) {
    const folio = parts[2];
    const service = createServiceClient();
    const { data } = await service.from('service_orders').select('*').eq('folio', folio).maybeSingle();
    return NextResponse.json({ success: true, data });
  }
  const auth = request.headers.get('authorization') || '';
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
  if (!token) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No autorizado' } }, { status: 401 });

  try {
    const tenantId = await getTenantId(token);
    const supabase = createAuthedClient(token);

    if (endpoint === 'auth/me') {
      const { data: user } = await supabase.auth.getUser(token);
      const localUser = await getLocalUser(supabase, user.user?.id || '');
      const shop = await getLatestShop(supabase, tenantId);
      const subscription = await getLatestSubscription(supabase, tenantId);
      return NextResponse.json({
        success: true,
        data: {
          accessToken: token,
          refreshToken: '',
          expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
          user: localUser || null,
          shop: shop || null,
          subscription,
          roles: [],
          permissions: []
        }
      });
    }

    if (endpoint === 'subscription/status') {
      const { data } = await supabase.from('subscriptions').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(1);
      return NextResponse.json({ success: true, data: { subscription: data?.[0] || null } });
    }

    if (endpoint === 'suppliers') {
      const { data, error } = await supabase.from('suppliers').select('*').eq('tenant_id', tenantId).order('updated_at', { ascending: false });
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (endpoint === 'products') {
      const { data, error } = await supabase.from('inventory_products').select('*').eq('tenant_id', tenantId).order('updated_at', { ascending: false });
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (endpoint === 'inventory/movements') {
      const productId = new URL(request.url).searchParams.get('product_id') || undefined;
      let query = supabase.from('inventory_movements').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false });
      if (productId) query = query.eq('product_id', productId);
      const { data, error } = await query;
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (endpoint === 'customers') {
      const { data, error } = await supabase.from('customers').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false });
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (endpoint === 'expense-categories') {
      const { data, error } = await supabase.from('expense_categories').select('*').eq('tenant_id', tenantId).order('updated_at', { ascending: false });
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (endpoint === 'expenses') {
      const { data, error } = await supabase.from('expenses').select('*,category:expense_categories(*)').eq('tenant_id', tenantId).order('expense_date', { ascending: false }).order('created_at', { ascending: false });
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (endpoint === 'purchases') {
      const { data, error } = await supabase.from('purchase_orders').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false });
      if (error) throw error;
      const orders = await Promise.all((data || []).map(async (order) => {
        const { data: items } = await supabase.from('purchase_items').select('*').eq('purchase_order_id', order.id).order('created_at', { ascending: true });
        return { ...order, items: items || [] };
      }));
      return NextResponse.json({ success: true, data: orders });
    }

    if (endpoint === 'service-orders') {
      const { data, error } = await supabase.from('service_orders').select('*').eq('tenant_id', tenantId).order('updated_at', { ascending: false });
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    if (endpoint.match(/^service-orders\/[^/]+\/timeline$/)) {
      const serviceOrderId = parts[1];
      const data = await getServiceOrderTimeline(supabase, serviceOrderId);
      return NextResponse.json({ success: true, data });
    }

    if (endpoint === 'reports/operations') {
      const { from, to } = parseRange(new URL(request.url));
      const { data: serviceOrders } = await supabase.from('service_orders').select('id,status,created_at,updated_at,total_amount_cents,reported_issue,customer_id').eq('tenant_id', tenantId);
      const { data: quotes } = await supabase.from('quotations').select('id,status,total_amount_cents,created_at').eq('tenant_id', tenantId);
      const { data: expenses } = await supabase.from('expenses').select('id,amount_cents,expense_date,created_at,description').eq('tenant_id', tenantId);
      return NextResponse.json({ success: true, data: { from, to, serviceOrders: serviceOrders || [], quotes: quotes || [], expenses: expenses || [] } });
    }

    if (endpoint === 'reports/finance') {
      const { from, to } = parseRange(new URL(request.url));
      const { data: summary } = await supabase.from('expenses').select('amount_cents,expense_date').eq('tenant_id', tenantId);
      const totalExpensesCents = (summary || []).reduce((acc, row) => acc + Number(row.amount_cents || 0), 0);
      return NextResponse.json({ success: true, data: { from, to, totalIncomeCents: 0, totalExpensesCents, totalPurchasesCents: 0, accountsReceivableCents: 0, balanceCents: -totalExpensesCents, revenueSource: 'none', notes: [] } });
    }

    if (endpoint === 'reports/inventory') {
      const { from, to } = parseRange(new URL(request.url));
      const { data: products } = await supabase.from('inventory_products').select('*').eq('tenant_id', tenantId);
      const { data: movements } = await supabase.from('inventory_movements').select('*').eq('tenant_id', tenantId);
      return NextResponse.json({ success: true, data: { from, to, products: products || [], movements: movements || [] } });
    }

    if (endpoint === 'reports/purchases-expenses') {
      const { from, to } = parseRange(new URL(request.url));
      const { data: purchaseOrders } = await supabase.from('purchase_orders').select('*').eq('tenant_id', tenantId);
      const { data: expenses } = await supabase.from('expenses').select('*').eq('tenant_id', tenantId);
      return NextResponse.json({ success: true, data: { from, to, purchaseOrders: purchaseOrders || [], expenses: expenses || [] } });
    }

    if (endpoint === 'finance/summary') {
      const { data: expenses } = await supabase.from('expenses').select('amount_cents').eq('tenant_id', tenantId);
      const { data: purchases } = await supabase.from('purchase_orders').select('total_amount_cents,status').eq('tenant_id', tenantId);
      const totalExpensesCents = (expenses || []).reduce((acc, row) => acc + Number(row.amount_cents || 0), 0);
      const totalPurchasesCents = (purchases || []).filter((row) => String(row.status).toLowerCase() === 'confirmed').reduce((acc, row) => acc + Number(row.total_amount_cents || 0), 0);
      return NextResponse.json({ success: true, data: { totalIncomeCents: 0, totalExpensesCents, totalPurchasesCents, accountsReceivableCents: 0, balanceCents: -totalExpensesCents - totalPurchasesCents, revenueSource: 'none', notes: [] } });
    }

    if (endpoint === 'finance/monthly') {
      const months = [];
      const now = new Date();
      for (let i = 0; i < 6; i += 1) {
        const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
        const monthKey = d.toISOString().slice(0, 7);
        const nextMonth = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)).toISOString().slice(0, 10);
        const { data: expenses } = await supabase.from('expenses').select('amount_cents,expense_date').eq('tenant_id', tenantId).gte('expense_date', `${monthKey}-01`).lt('expense_date', nextMonth);
        const { data: purchases } = await supabase.from('purchase_orders').select('total_amount_cents,status,created_at').eq('tenant_id', tenantId).gte('created_at', `${monthKey}-01`).lt('created_at', nextMonth);
        const expensesCents = (expenses || []).reduce((acc, row) => acc + Number(row.amount_cents || 0), 0);
        const purchasesCents = (purchases || []).filter((row) => String(row.status).toLowerCase() === 'confirmed').reduce((acc, row) => acc + Number(row.total_amount_cents || 0), 0);
        months.unshift({ month: monthKey, incomeCents: 0, expensesCents, purchasesCents, receivablesCents: 0, balanceCents: -expensesCents - purchasesCents });
      }
      return NextResponse.json({ success: true, data: { months } });
    }

    if (endpoint === 'finance/transactions') {
      const { data: expenses } = await supabase.from('expenses').select('id,description,amount_cents,expense_date,created_at').eq('tenant_id', tenantId);
      const { data: purchases } = await supabase.from('purchase_orders').select('id,notes,total_amount_cents,status,created_at').eq('tenant_id', tenantId);
      const transactions = [
        ...((expenses || []).map((row) => ({ id: row.id, description: row.description, date: row.expense_date || row.created_at, source: 'expense', type: 'expense', amount_cents: Number(row.amount_cents || 0), category: null }))),
        ...((purchases || []).map((row) => ({ id: row.id, description: row.notes || 'Compra', date: row.created_at, source: 'purchase', type: 'purchase', amount_cents: Number(row.total_amount_cents || 0), category: null })))
      ].sort((a, b) => String(b.date).localeCompare(String(a.date)));
      return NextResponse.json({ success: true, data: transactions });
    }

    if (endpoint === 'dashboard/summary') {
      const { data: expenses } = await supabase.from('expenses').select('amount_cents').eq('tenant_id', tenantId);
      const { data: purchases } = await supabase.from('purchase_orders').select('total_amount_cents,status').eq('tenant_id', tenantId);
      const totalExpensesCents = (expenses || []).reduce((acc, row) => acc + Number(row.amount_cents || 0), 0);
      const totalPurchasesCents = (purchases || []).filter((row) => String(row.status).toLowerCase() === 'confirmed').reduce((acc, row) => acc + Number(row.total_amount_cents || 0), 0);
      return NextResponse.json({ success: true, data: { totalExpensesCents, totalPurchasesCents, balanceCents: -totalExpensesCents - totalPurchasesCents, notes: [] } });
    }

    if (endpoint === 'evidences/signed-upload') {
      const { bucket, path, expiresInSeconds } = await request.json();
      if (!bucket || !path) throw new Error('bucket y path son obligatorios');
      const service = createServiceClient();
      const { data, error } = await service.storage.from(bucket).createSignedUploadUrl(path);
      if (error) throw error;
      return NextResponse.json({ success: true, data: { signedUrl: data?.signedUrl || null, url: data?.signedUrl || null, expiresInSeconds: expiresInSeconds || 600 } });
    }
    return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'No encontrado' } }, { status: 404 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ success: false, error: { code: 'DOMAIN_ERROR', message } }, { status: 400 });
  }
}

async function writeEntity(request: Request, endpoint: string, tenantId: string, token: string) {
  const supabase = createAuthedClient(token);
  const body = await request.json();
  if (endpoint === 'suppliers') {
    return supabase.from('suppliers').insert({ ...body, tenant_id: tenantId }).select('*').single();
  }
  if (endpoint === 'products') {
    return supabase.from('inventory_products').insert({ ...body, tenant_id: tenantId }).select('*').single();
  }
  if (endpoint === 'inventory/movements') {
    return supabase.from('inventory_movements').insert({ ...body, tenant_id: tenantId }).select('*').single();
  }
  if (endpoint === 'customers') {
    return supabase.from('customers').insert({ ...body, tenant_id: tenantId }).select('*').single();
  }
  if (endpoint === 'expense-categories') {
    return supabase.from('expense_categories').insert({ ...body, tenant_id: tenantId }).select('*').single();
  }
  if (endpoint === 'expenses') {
    return supabase.from('expenses').insert({ ...body, tenant_id: tenantId }).select('*,category:expense_categories(*)').single();
  }
  if (endpoint === 'service-orders') {
    return supabase.from('service_orders').insert({ ...body, tenant_id: tenantId }).select('*').single();
  }
  if (endpoint === 'purchases') {
    const service = createServiceClient();
    const { data: supplier } = await supabase.from('suppliers').select('id,tenant_id').eq('id', body.supplierId).maybeSingle();
    if (!supplier || supplier.tenant_id !== tenantId) throw new Error('Proveedor fuera del tenant');
    const { data: createdOrder, error } = await service.rpc('create_purchase_order', {
      p_tenant_id: tenantId,
      p_supplier_id: body.supplierId,
      p_notes: body.notes ?? null,
      p_items: body.items
    });
    if (error) throw error;
    const orderId = String(createdOrder);
    const { data: order } = await supabase.from('purchase_orders').select('*').eq('id', orderId).single();
    const { data: items } = await supabase.from('purchase_items').select('*').eq('purchase_order_id', orderId).order('created_at', { ascending: true });
    return { data: { ...order, items: items || [] }, error: null };
  }
  if (endpoint === 'service-orders') {
    const { data: customer } = await supabase.from('customers').select('id,tenant_id').eq('id', body.customerId).maybeSingle();
    if (!customer || customer.tenant_id !== tenantId) throw new Error('Cliente fuera del tenant');
    return supabase.from('service_orders').insert({ ...body, tenant_id: tenantId }).select('*').single();
  }
  throw new Error('No soportado');
}

export async function POST(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const parts = pathParts(path);
  const endpoint = parts.join('/');
  const auth = request.headers.get('authorization') || '';
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
  const publicPostEndpoints = new Set(['auth/login', 'auth/register']);
  if (publicPostEndpoints.has(endpoint)) {
    try {
      const supabase = createAuthedClient(token);
      if (endpoint === 'auth/login') {
        const body = await request.json();
        const { data, error } = await supabase.auth.signInWithPassword({ email: body.email, password: body.password });
        if (error) throw error;
        if (!data.session) throw new Error('No se recibió sesión');
        return NextResponse.json({ success: true, data: { accessToken: data.session.access_token, refreshToken: data.session.refresh_token, expiresAt: new Date((data.session.expires_at || 0) * 1000).toISOString() } });
      }

      const body = await request.json();
      const { data, error } = await supabase.auth.signUp({
        email: body.email,
        password: body.password,
        options: { data: { full_name: body.fullName, shop_name: body.tenantId, tenant_slug: body.tenantId } }
      });
      if (error) throw error;
      return NextResponse.json({ success: true, data: data.user });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error interno';
      return NextResponse.json({ success: false, error: { code: 'DOMAIN_ERROR', message } }, { status: 400 });
    }
  }
  if (!token) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No autorizado' } }, { status: 401 });

  try {
    const tenantId = await getTenantId(token);
    const supabase = createAuthedClient(token);

    if (endpoint === 'auth/oauth/bootstrap') {
      const { data: user } = await supabase.auth.getUser(token);
      const localUser = await getLocalUser(supabase, user.user?.id || '');
      const shop = await getLatestShop(supabase, tenantId);
      const subscription = await getLatestSubscription(supabase, tenantId);
      return NextResponse.json({ success: true, data: { accessToken: token, refreshToken: '', expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(), user: localUser, shop, subscription, roles: [], permissions: [] } });
    }

    const body = ['suppliers', 'products', 'inventory/movements', 'customers', 'expense-categories', 'expenses', 'service-orders', 'purchases'].includes(endpoint)
      ? await writeEntity(request, endpoint, tenantId, token)
      : null;
    if (body && 'error' in body && body.error) throw body.error;
    if (body && 'data' in body) return NextResponse.json({ success: true, data: body.data });

    const supplierMatch = endpoint.match(/^suppliers\/([^/]+)$/);
    if (supplierMatch) {
      const supplierId = supplierMatch[1];
      if (request.method === 'PATCH') {
        const payload = await request.json();
        const { data, error } = await supabase.from('suppliers').update({ ...payload }).eq('id', supplierId).eq('tenant_id', tenantId).select('*').single();
        if (error) throw error;
        return NextResponse.json({ success: true, data });
      }
      if (request.method === 'DELETE') {
        const { error } = await supabase.from('suppliers').delete().eq('id', supplierId).eq('tenant_id', tenantId);
        if (error) throw error;
        return NextResponse.json({ success: true, data: { deleted: true } });
      }
      if (request.method === 'GET') {
        const { data, error } = await supabase.from('suppliers').select('*').eq('id', supplierId).eq('tenant_id', tenantId).maybeSingle();
        if (error) throw error;
        return NextResponse.json({ success: true, data });
      }
    }

    const productMatch = endpoint.match(/^products\/([^/]+)$/);
    if (productMatch) {
      const productId = productMatch[1];
      if (request.method === 'GET') {
        const { data, error } = await supabase.from('inventory_products').select('*').eq('id', productId).eq('tenant_id', tenantId).maybeSingle();
        if (error) throw error;
        return NextResponse.json({ success: true, data });
      }
      if (request.method === 'PATCH') {
        const payload = await request.json();
        const { data, error } = await supabase.from('inventory_products').update({ ...payload }).eq('id', productId).eq('tenant_id', tenantId).select('*').single();
        if (error) throw error;
        return NextResponse.json({ success: true, data });
      }
    }

    const purchaseMatch = endpoint.match(/^purchases\/([^/]+)$/);
    if (purchaseMatch && request.method === 'GET') {
      const order = await supabase.from('purchase_orders').select('*').eq('id', purchaseMatch[1]).eq('tenant_id', tenantId).maybeSingle();
      if (order.error) throw order.error;
      const items = await getPurchaseOrderItems(supabase, purchaseMatch[1]);
      return NextResponse.json({ success: true, data: { ...(order.data || {}), items } });
    }
    const purchaseConfirmMatch = endpoint.match(/^purchases\/([^/]+)\/confirm$/);
    if (purchaseConfirmMatch && request.method === 'POST') {
      const purchaseId = purchaseConfirmMatch[1];
      const { data, error } = await supabase.from('purchase_orders').update({ status: 'confirmed', confirmed_at: new Date().toISOString() }).eq('id', purchaseId).eq('tenant_id', tenantId).select('*').single();
      if (error) throw error;
      const items = await getPurchaseOrderItems(supabase, purchaseId);
      return NextResponse.json({ success: true, data: { ...data, items } });
    }
    const purchaseCancelMatch = endpoint.match(/^purchases\/([^/]+)\/cancel$/);
    if (purchaseCancelMatch && request.method === 'POST') {
      const purchaseId = purchaseCancelMatch[1];
      const { data, error } = await supabase.from('purchase_orders').update({ status: 'cancelled', cancelled_at: new Date().toISOString() }).eq('id', purchaseId).eq('tenant_id', tenantId).select('*').single();
      if (error) throw error;
      const items = await getPurchaseOrderItems(supabase, purchaseId);
      return NextResponse.json({ success: true, data: { ...data, items } });
    }

    const serviceOrderMatch = endpoint.match(/^service-orders\/([^/]+)\/status$/);
    if (serviceOrderMatch && request.method === 'PATCH') {
      const payload = await request.json();
      const { data, error } = await supabase.from('service_orders').update({ status: payload.status, status_updated_at: new Date().toISOString() }).eq('id', serviceOrderMatch[1]).eq('tenant_id', tenantId).select('*').single();
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }

    const timelineMatch = endpoint.match(/^service-orders\/([^/]+)\/timeline$/);
    if (timelineMatch && request.method === 'GET') {
      const data = await getServiceOrderTimeline(supabase, timelineMatch[1]);
      return NextResponse.json({ success: true, data });
    }

    const expenseMatch = endpoint.match(/^expenses\/([^/]+)$/);
    if (expenseMatch && request.method === 'DELETE') {
      const { error } = await supabase.from('expenses').delete().eq('id', expenseMatch[1]).eq('tenant_id', tenantId);
      if (error) throw error;
      return NextResponse.json({ success: true, data: { deleted: true } });
    }

    if (endpoint === 'portal/orders/' || endpoint.startsWith('portal/orders/')) {
      const folio = endpoint.split('/').pop();
      const { data } = await supabase.from('service_orders').select('*').eq('folio', folio).maybeSingle();
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'No encontrado' } }, { status: 404 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error interno';
    return NextResponse.json({ success: false, error: { code: 'DOMAIN_ERROR', message } }, { status: 400 });
  }
}
