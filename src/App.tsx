import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { apiUrl, csvCell, parseResponse } from './lib/api';

type Booking = {
  id: string;
  ticket_code?: string;
  customer_name?: string;
  mobile?: string;
  quantity?: number;
  unit_price?: number;
  total_amount?: number;
  status?: string;
  payment_status?: string;
  payment_method?: string;
  created_at?: string;
  passes?: {
    pass_code?: string;
    pass_name?: string;
    price?: number;
  };
  spots?: {
    spot_code?: string;
    spot_name?: string;
  };
};

type BookingStats = {
  total?: number;
  perStatus?: Record<string, number>;
};

type Payload = {
  success: boolean;
  bookings: Booking[];
  stats?: BookingStats;
};

const STORAGE_KEY = 'rrg_admin_key';
const STATUS_OPTIONS = ['PRE_BOOKED', 'COLLECTED', 'CHECKED_IN', 'CANCELLED'];

const formatCurrency = (value?: number) => {
  if (value == null) {
    return '—';
  }

  return `₹${Number(value).toLocaleString('en-IN')}`;
};

const formatDate = (value?: string) => {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleString('en-IN');
};

export default function App() {
  const [key, setKey] = useState(() => sessionStorage.getItem(STORAGE_KEY) ?? '');
  const [input, setInput] = useState('');
  const [rows, setRows] = useState<Booking[]>([]);
  const [stats, setStats] = useState<BookingStats>({});
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const loadBookings = useCallback(async () => {
    if (!key) {
      return;
    }

    setBusy(true);
    setError('');

    try {
      const params = new URLSearchParams();
      const trimmedSearch = search.trim();

      if (trimmedSearch) {
        params.set('search', trimmedSearch);
      }

      if (status !== 'ALL') {
        params.set('status', status);
      }

      const data = await parseResponse<Payload>(
        await fetch(apiUrl(`/api/admin-bookings?${params.toString()}`), {
          headers: { 'x-api-key': key },
        }),
      );

      setRows(data.bookings ?? []);
      setStats(data.stats ?? {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load bookings');
    } finally {
      setBusy(false);
    }
  }, [key, search, status]);

  useEffect(() => {
    if (key) {
      void loadBookings();
    }
  }, [key, loadBookings]);

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedValue = input.trim();
    if (!trimmedValue) {
      return;
    }

    sessionStorage.setItem(STORAGE_KEY, trimmedValue);
    setKey(trimmedValue);
    setInput('');
  };

  const handleLogout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setKey('');
    setRows([]);
    setStats({});
    setError('');
  };

  const exportCsv = () => {
    const headers = [
      'Ticket',
      'Customer',
      'Mobile',
      'Pass',
      'Hub',
      'Quantity',
      'Amount',
      'Status',
      'Payment',
      'Created',
    ];

    const csvRows = rows.map((booking) => {
      const values = [
        booking.ticket_code,
        booking.customer_name,
        booking.mobile,
        booking.passes?.pass_name ?? booking.passes?.pass_code,
        booking.spots?.spot_name,
        booking.quantity,
        booking.total_amount,
        booking.status,
        booking.payment_status,
        booking.created_at,
      ].map(csvCell);

      return values;
    });

    const csv = [headers, ...csvRows]
      .map((row) =>
        row
          .map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`)
          .join(','),
      )
      .join('\r\n');

    const link = document.createElement('a');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });

    link.href = URL.createObjectURL(blob);
    link.download = `raas-rang-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (!key) {
    return (
      <main className="login">
        <form className="login-card" onSubmit={handleLogin}>
          <div className="mark">R~R</div>
          <p className="eyebrow">EVENT OPERATIONS · 2026</p>
          <h1>Admin access</h1>
          <p className="muted">Enter the admin API key to access booking operations.</p>

          <label htmlFor="admin-key">Admin API key</label>
          <input
            id="admin-key"
            type="password"
            autoComplete="current-password"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            required
          />

          <button type="submit">Continue securely</button>

          <small>
            Key is held in this tab's session storage and sent only to the configured
            API origin.
          </small>
        </form>
      </main>
    );
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="mark small">R~R</span>
          <div>
            <b>RAAS~RANG</b>
            <small>ADMIN CONSOLE</small>
          </div>
        </div>

        <div className="navlabel">WORKSPACE</div>
        <div className="navitem active">▦ <span>Bookings</span></div>
        <div className="navitem mutednav">
          ⌖ <span>Hub management</span>
          <em>Next phase</em>
        </div>
        <div className="navitem mutednav">
          ♙ <span>Agents</span>
          <em>Next phase</em>
        </div>

        <div className="sidefoot">
          <span className="live-dot" />
          Backend-connected view
          <button type="button" className="logout" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="content">
        <header>
          <div>
            <p className="eyebrow">RAAS~RANG GARBA NIGHTS 2026</p>
            <h1>Booking overview</h1>
            <p className="muted">Live records from the existing ticketing backend.</p>
          </div>

          <div className="actions">
            <button
              type="button"
              className="secondary"
              onClick={() => void loadBookings()}
              disabled={busy}
            >
              {busy ? 'Refreshing…' : '↻ Refresh'}
            </button>
            <button type="button" onClick={exportCsv} disabled={!rows.length}>
              ↓ Export CSV
            </button>
          </div>
        </header>

        {error && (
          <div className="error">
            {error}
            <p>
              Check the API origin, admin key, and backend endpoint compatibility.
              No database changes were made.
            </p>
          </div>
        )}

        <section className="metrics">
          <article>
            <small>Bookings in result</small>
            <strong>{stats.total ?? rows.length}</strong>
          </article>
          <article>
            <small>Pre-booked</small>
            <strong>{stats.perStatus?.PRE_BOOKED ?? '—'}</strong>
          </article>
          <article>
            <small>Collected</small>
            <strong>{stats.perStatus?.COLLECTED ?? '—'}</strong>
          </article>
          <article>
            <small>Checked in</small>
            <strong>{stats.perStatus?.CHECKED_IN ?? '—'}</strong>
          </article>
          <article>
            <small>Cancelled</small>
            <strong>{stats.perStatus?.CANCELLED ?? '—'}</strong>
          </article>
        </section>

        <section className="panel">
          <div className="filters">
            <div>
              <h2>Reservations</h2>
              <p className="muted">
                Read-only in this starter; lifecycle actions will be added after API
                safety review.
              </p>
            </div>

            <input
              aria-label="Search bookings"
              placeholder="Search ticket, name, mobile…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <select
              aria-label="Filter status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="ALL">All statuses</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Attendee</th>
                  <th>Pass</th>
                  <th>Hub</th>
                  <th>Qty</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((booking) => (
                  <tr key={booking.id}>
                    <td className="ticket">{booking.ticket_code || '—'}</td>
                    <td>
                      <b>{booking.customer_name || '—'}</b>
                      <small>{booking.mobile || ''}</small>
                    </td>
                    <td>
                      {booking.passes?.pass_name || booking.passes?.pass_code || '—'}
                    </td>
                    <td>{booking.spots?.spot_name || '—'}</td>
                    <td>{booking.quantity ?? '—'}</td>
                    <td>{formatCurrency(booking.total_amount)}</td>
                    <td>
                      {booking.payment_status || '—'}
                      {booking.payment_method ? ` · ${booking.payment_method}` : ''}
                    </td>
                    <td>
                      <span className={`pill ${(booking.status || '').toLowerCase()}`}>
                        {booking.status || '—'}
                      </span>
                    </td>
                    <td>{formatDate(booking.created_at)}</td>
                  </tr>
                ))}

                {!rows.length && (
                  <tr>
                    <td colSpan={9} className="empty">
                      {busy ? 'Loading records…' : 'No bookings returned for these filters.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <footer>
          Private operations interface · Separate deployment · Supabase credentials remain
          server-side
        </footer>
      </main>
    </div>
  );
}
