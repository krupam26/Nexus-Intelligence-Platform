import type { AuditEntry, Dataset, Listing, Notification, Supplier } from '../types'

export const SUPPLIERS: Supplier[] = [
  { id: 'SUP-A', code: 'A', name: 'Aurora Bedbank', type: 'Bedbank', integration: 'Live API', region: 'Global', contact: 'Priya Raman', email: 'connect@aurorabeds.io', reliability: 94, since: '2019-04-12', color: '#4F46E5' },
  { id: 'SUP-B', code: 'B', name: 'Meridian Connect', type: 'Channel Manager', integration: 'Live API', region: 'APAC', contact: 'Daniel Okafor', email: 'partners@meridianconnect.com', reliability: 88, since: '2020-09-01', color: '#0E9F6E' },
  { id: 'SUP-C', code: 'C', name: 'Saffron Direct', type: 'Direct Contracts', integration: 'Batch SFTP', region: 'India', contact: 'Arjun Mehta', email: 'ops@saffrondirect.in', reliability: 91, since: '2018-01-22', color: '#E8590C' },
  { id: 'SUP-D', code: 'D', name: 'BlueTide Travel', type: 'OTA Aggregator', integration: 'Manual Upload', region: 'India, ME', contact: 'Sara Haddad', email: 'data@bluetide.travel', reliability: 79, since: '2021-06-15', color: '#0891B2' },
  { id: 'SUP-E', code: 'E', name: 'Lotus Holidays', type: 'Wholesaler', integration: 'Paused', region: 'South Asia', contact: 'Ken Sato', email: 'feeds@lotusholidays.asia', reliability: 66, since: '2022-11-03', color: '#C026D3' },
]

type L = Omit<Listing, 'id' | 'supplierId'>
const A: L[] = [
  { name: 'Grand Hyatt Mumbai', address: 'Off Western Express Highway, Santacruz East, Mumbai 400055', city: 'Mumbai', lat: 19.0773, lng: 72.851, stars: 5, description: 'Luxury hotel and residences near Bandra Kurla Complex with art collection, spa and multiple restaurants.', amenities: ['Free WiFi', 'Outdoor Pool', 'Spa', 'Fitness Centre', 'Restaurant', 'Bar', 'Business Centre'], phone: '+91 22 6676 1234' },
  { name: 'Taj Palace', address: '2 Sardar Patel Marg, Diplomatic Enclave, New Delhi 110021', city: 'New Delhi', lat: 28.596, lng: 77.1712, stars: 5, description: 'Iconic palace hotel set in six acres of gardens in the diplomatic enclave with award winning restaurants.', amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar', 'Valet Parking'], phone: '+91 11 2611 0202' },
  { name: 'The Leela Palace Bangalore', address: '23 Old Airport Rd, Kodihalli, Bangalore 560008', city: 'Bangalore', lat: 12.9606, lng: 77.6484, stars: 5, description: 'Palatial hotel inspired by the Mysore palace with lush gardens, spa and fine dining.', amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar'], phone: '+91 80 2521 1234' },
  { name: 'Novotel Juhu Beach', address: 'Balraj Sahani Marg, Juhu Beach, Mumbai 400049', city: 'Mumbai', lat: 19.103, lng: 72.8265, stars: 5, description: 'Beachfront hotel on Juhu beach with sea facing rooms, pool and nightlife venues.', amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant', 'Bar', 'Beach Access'], phone: '+91 22 6693 4444' },
  { name: 'Novotel Mumbai Juhu Beach Hotel', address: 'Balraj Sahani Marg, Juhu, Mumbai', city: 'Mumbai', lat: 19.1031, lng: 72.8266, stars: 5, description: 'Sea facing rooms on Juhu beach with outdoor pool.', amenities: ['WiFi', 'Pool', 'Restaurant', 'Beach Access'] },
  { name: 'Taj Exotica Resort & Spa Goa', address: 'Calwaddo, Benaulim, Salcete, Goa 403716', city: 'Goa', lat: 15.247, lng: 73.92, stars: 5, description: 'Mediterranean style beach resort on 56 acres of landscaped gardens facing the Arabian Sea.', amenities: ['WiFi', 'Pool', 'Spa', 'Beach Access', 'Restaurant', 'Gym'], phone: '+91 832 668 3333' },
  { name: 'Radisson Blu Plaza Delhi Airport', address: 'NH-8, Mahipalpur, New Delhi 110037', city: 'New Delhi', lat: 28.544, lng: 77.117, stars: 5, description: 'Airport hotel minutes from IGI Airport with outdoor pool and seven dining options.', amenities: ['WiFi', 'Pool', 'Airport Shuttle', 'Gym', 'Restaurant', 'Bar'] },
  { name: 'Rambagh Palace', address: 'Bhawani Singh Rd, Rambagh, Jaipur 302005', city: 'Jaipur', lat: 26.898, lng: 75.808, stars: 5, description: 'Former residence of the Maharaja of Jaipur with 47 acres of Mughal gardens.', amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Bar'] },
  { name: 'The Lalit New Delhi', address: 'Barakhamba Avenue, Connaught Place, New Delhi 110001', city: 'New Delhi', lat: 28.631, lng: 77.227, stars: 5, description: 'Central luxury hotel near Connaught Place with art installations and rooftop pool.', amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Bar', 'Gym'] },
  { name: 'Alila Diwa Goa', address: '48/10 Adao Waddo, Majorda, Salcete, Goa 403713', city: 'Goa', lat: 15.284, lng: 73.942, stars: 5, description: 'Contemporary resort overlooking paddy fields near Majorda beach with infinity pool.', amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant'] },
]
const B: L[] = [
  { name: 'Hyatt Grand Mumbai', address: 'Western Express Hwy, Santacruz (E), Mumbai', city: 'Mumbai', lat: 19.0775, lng: 72.8512, stars: 5, description: 'Luxury hotel near BKC featuring contemporary art, a full service spa and seven restaurants.', amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Lounge', 'Meeting Rooms'], phone: '+91 22 6676 1234' },
  { name: 'The Taj Palace, New Delhi', address: 'Sardar Patel Marg, Diplomatic Enclave, Chanakyapuri, New Delhi', city: 'Delhi', lat: 28.5962, lng: 77.1714, stars: 5, description: 'Palace hotel with sprawling gardens in Chanakyapuri, close to the airport and embassies.', amenities: ['Free Wi-Fi', 'Swimming Pool', 'Spa', 'Fitness', 'Dining', 'Bar'] },
  { name: 'Hotel Sunshine', address: 'Calangute Baga Road, Calangute, Goa 403516', city: 'Goa', lat: 15.544, lng: 73.763, stars: 3, description: 'Budget friendly hotel a short walk from Calangute beach with pool.', amenities: ['WiFi', 'Pool', 'Restaurant'] },
  { name: 'Taj Exotica Benaulim', address: 'Calwaddo, Benaulim, Goa', city: 'Goa', lat: 15.2472, lng: 73.9203, stars: 5, description: 'Beach resort with landscaped gardens and private beach access in South Goa.', amenities: ['WiFi', 'Pool', 'Spa', 'Beach', 'Restaurant'] },
  { name: 'Trident Nariman Point', address: 'Nariman Point, Marine Drive, Mumbai 400021', city: 'Mumbai', lat: 18.927, lng: 72.8205, stars: 5, description: 'Hotel overlooking the Arabian Sea and Marine Drive with views of the Queens Necklace.', amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant', 'Bar'] },
  { name: 'ITC Rajputana, a Luxury Collection Hotel', address: 'Palace Road, Gopalbari, Jaipur 302006', city: 'Jaipur', lat: 26.9196, lng: 75.797, stars: 5, description: 'Haveli inspired hotel with Rajput architecture, courtyards and heritage dining.', amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar'] },
  { name: 'Hilton Bangalore Embassy Manyata Business Park', address: 'Embassy Manyata Business Park, Outer Ring Rd, Nagavara, Bangalore 560045', city: 'Bangalore', lat: 13.045, lng: 77.62, stars: 5, description: 'Business hotel inside Manyata Tech Park with rooftop bar and outdoor pool.', amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant', 'Bar', 'Business Centre'] },
  { name: 'The Oberoi Bengaluru', address: '37-39 MG Road, Bangalore 560001', city: 'Bangalore', lat: 12.973, lng: 77.619, stars: 5, description: 'Garden hotel on MG Road with a century old rain tree and spa.', amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Bar'] },
  { name: 'Royal Orchid Central Jaipur', address: 'Ajmer Road, Opp Hotel Clarks, Jaipur', city: 'Jaipur', lat: 26.905, lng: 75.772, stars: 4, description: 'Business hotel on Ajmer road close to the old city with rooftop pool.', amenities: ['WiFi', 'Pool', 'Restaurant'] },
]
const C: L[] = [
  { name: 'Taj Hotel Palace', address: '2, Sardar Patel Marg, New Delhi 110021', city: 'New Delhi', lat: 28.5959, lng: 77.1711, stars: 5, description: 'Luxury palace hotel in the diplomatic enclave with landscaped gardens and fine dining.', amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant'] },
  { name: 'Sunshine Residency', address: '18th June Road, Panjim, Goa 403001', city: 'Goa', lat: 15.496, lng: 73.827, stars: 3, description: 'Serviced apartments in the heart of Panjim city near the market.', amenities: ['WiFi', 'Kitchenette', 'Parking'] },
  { name: 'Leela Palace Bengaluru', address: 'No. 23, Old Airport Road, Bengaluru', city: 'Bengaluru', lat: 12.9608, lng: 77.6486, stars: 5, description: 'Palace style luxury hotel with gardens, spa and acclaimed restaurants on Old Airport Road.', amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Bar', 'Fitness Centre'] },
  { name: 'Novotel Mumbai Juhu', address: 'Balraj Sahani Marg, Juhu Beach, Mumbai', city: 'Mumbai', lat: 19.1029, lng: 72.8264, stars: 5, description: 'Beachfront hotel with sea views, pool and Juhu beach access.', amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant', 'Beach Access'] },
  { name: 'Trident Hotel Mumbai', address: 'Nariman Point, Mumbai', city: 'Mumbai', lat: 18.9273, lng: 72.8207, stars: 5, description: 'Sea facing hotel at Nariman Point near Marine Drive.', amenities: ['WiFi', 'Pool', 'Restaurant'] },
  { name: 'Radisson Blu Hotel New Delhi Paschim Vihar', address: 'District Centre, Paschim Vihar, New Delhi 110063', city: 'New Delhi', lat: 28.668, lng: 77.102, stars: 5, description: 'West Delhi hotel with banqueting, pool and multiple restaurants.', amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant', 'Bar'] },
  { name: 'Taj Rambagh Palace', address: 'Bhawani Singh Road, Jaipur', city: 'Jaipur', lat: 26.8982, lng: 75.8082, stars: 5, description: 'Heritage palace hotel, former royal residence, with Mughal gardens and polo bar.', amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant', 'Bar'] },
  { name: 'Hotel Royal Orchid', address: 'Ajmer Rd, Jaipur 302006', city: 'Jaipur', lat: 26.9052, lng: 75.7722, stars: 4, description: 'Business hotel close to old city with pool.', amenities: ['WiFi', 'Restaurant'] },
]
const D: L[] = [
  { name: 'Grand Hyatt Mumbai Hotel & Residences', address: 'Off WEH, Santacruz East, Mumbai 400055', city: 'Mumbai', lat: 19.0771, lng: 72.8509, stars: 5, description: 'Luxury hotel with serviced residences near BKC, spa and restaurants.', amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant'] },
  { name: 'Hyatt Regency Mumbai', address: 'Sahar Airport Road, Andheri East, Mumbai 400099', city: 'Mumbai', lat: 19.1, lng: 72.865, stars: 5, description: 'Airport hotel opposite the international terminal with pool and spa.', amenities: ['WiFi', 'Pool', 'Spa', 'Airport Shuttle', 'Restaurant'] },
  { name: 'ITC Rajputana Jaipur', address: 'Palace Rd, Gopalbari, Jaipur', city: 'Jaipur', lat: 26.9198, lng: 75.7972, stars: 5, description: 'Heritage style hotel with Rajput architecture and courtyards near the railway station.', amenities: ['WiFi', 'Pool', 'Gym', 'Restaurant'] },
  { name: 'Novotel Mumbai Juhu Beach', address: 'Balraj Sahani Marg, Juhu, Mumbai 400049', city: 'Mumbai', lat: 19.1032, lng: 72.8267, stars: 5, description: 'Juhu beachfront hotel with sea facing rooms and pool.', amenities: ['WiFi', 'Pool', 'Restaurant', 'Bar'] },
  { name: 'Hilton Bengaluru Embassy Manyata', address: 'Manyata Embassy Business Park, ORR, Bengaluru', city: 'Bengaluru', lat: 13.0452, lng: 77.6202, stars: 5, description: 'Hilton hotel in Manyata business park with rooftop bar.', amenities: ['WiFi', 'Pool', 'Gym', 'Bar'] },
  { name: 'The Lalit', address: 'Barakhamba Ave, Connaught Place, New Delhi', city: 'Delhi', lat: 28.6312, lng: 77.2272, stars: 5, description: 'Luxury hotel at Connaught Place with rooftop pool.', amenities: ['WiFi', 'Pool', 'Restaurant', 'Bar'] },
  { name: 'Alila Diwa Goa', address: 'Adao Waddo, Majorda, Goa', city: 'Goa', lat: 15.2841, lng: 73.9421, stars: 5, description: 'Resort with infinity pool overlooking paddy fields near Majorda beach.', amenities: ['WiFi', 'Pool', 'Spa', 'Restaurant'] },
  { name: 'Alila Diwa Goa Resort', address: 'Majorda, Salcete, Goa 403713', city: 'Goa', lat: 15.2842, lng: 73.9419, stars: 5, description: 'Resort with infinity pool near Majorda beach.', amenities: ['WiFi', 'Pool', 'Spa'] },
  { name: 'JW Marriott Mumbai Juhu', address: 'Juhu Tara Road, Juhu, Mumbai 400049', city: 'Mumbai', lat: 19.1002, lng: 72.8268, stars: 5, description: 'Beachfront luxury hotel on Juhu Tara road with spa and pools.', amenities: ['WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Beach Access'] },
]
const E: L[] = [
  { name: 'Grand Hyatt Bombay', address: 'Santacruz, Mumbai', city: 'Mumbai', description: '', amenities: ['WiFi'], stars: 5 },
  { name: 'Leela Palace', address: 'Old Airport Road', city: 'Bangalore', description: 'Luxury hotel', amenities: [] },
  { name: 'Taj Palace Hotel Delhi', address: 'Chanakyapuri, Delhi', city: 'Delhi', description: '', amenities: ['Pool'], stars: 5 },
]

function build(code: string, rows: L[], datasetId: string): Listing[] {
  return rows.map((r, i) => ({ ...r, id: `${code}-${String(i + 1).padStart(4, '0')}`, supplierId: `SUP-${code}`, datasetId }))
}

export const LISTINGS: Listing[] = [
  ...build('A', A, 'DS-1042'),
  ...build('B', B, 'DS-1043'),
  ...build('C', C, 'DS-1039'),
  ...build('D', D, 'DS-1044'),
  ...build('E', E, 'DS-1031'),
]

const iso = (daysAgo: number, h = 10, m = 0) => {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

export const DATASETS: Dataset[] = [
  { id: 'DS-1044', supplierId: 'SUP-D', name: 'BlueTide India Q3 refresh', fileName: 'bluetide_inventory_q3.xlsx', format: 'Excel', uploadedAt: iso(0, 9, 12), records: 9, valid: 9, normalized: 9, status: 'Processed' },
  { id: 'DS-1043', supplierId: 'SUP-B', name: 'Meridian APAC delta', fileName: 'meridian_delta_0918.json', format: 'JSON', uploadedAt: iso(1, 16, 40), records: 9, valid: 9, normalized: 9, status: 'Processed' },
  { id: 'DS-1042', supplierId: 'SUP-A', name: 'Aurora full catalogue', fileName: 'aurora_hotels_full.csv', format: 'CSV', uploadedAt: iso(2, 11, 5), records: 10, valid: 10, normalized: 10, status: 'Processed' },
  { id: 'DS-1041', supplierId: 'SUP-E', name: 'Lotus Sept feed', fileName: 'lotus_sept.csv', format: 'CSV', uploadedAt: iso(3, 8, 30), records: 0, valid: 0, normalized: 0, status: 'Failed' },
  { id: 'DS-1039', supplierId: 'SUP-C', name: 'Saffron contracted rates', fileName: 'saffron_contracts.csv', format: 'CSV', uploadedAt: iso(5, 14, 0), records: 8, valid: 8, normalized: 8, status: 'Processed' },
  { id: 'DS-1031', supplierId: 'SUP-E', name: 'Lotus August feed', fileName: 'lotus_aug.csv', format: 'CSV', uploadedAt: iso(34, 10, 0), records: 3, valid: 2, normalized: 2, status: 'Processed' },
]

export const AUDIT: AuditEntry[] = [
  { id: 'au-6', at: iso(0, 9, 20), actor: 'System', action: 'Dataset processed', target: 'DS-1044 · BlueTide Travel', detail: '9 records normalized, 0 rejected', category: 'dataset' },
  { id: 'au-5', at: iso(0, 8, 2), actor: 'Ananya Iyer', action: 'Optimization run', target: 'Grand Hyatt Mumbai · Deluxe King', detail: 'Recommended Aurora Bedbank (score 95.4)', category: 'optimization' },
  { id: 'au-4', at: iso(1, 17, 15), actor: 'System', action: 'Matching run completed', target: 'All suppliers', detail: 'Auto-matched pairs refreshed', category: 'match' },
  { id: 'au-3', at: iso(3, 8, 31), actor: 'System', action: 'Dataset failed', target: 'DS-1041 · Lotus Holidays', detail: 'Header row missing: could not detect property name column', category: 'dataset' },
  { id: 'au-2', at: iso(4, 12, 0), actor: 'Ananya Iyer', action: 'Supplier updated', target: 'Lotus Holidays', detail: 'Integration paused pending feed fix', category: 'supplier' },
  { id: 'au-1', at: iso(6, 15, 10), actor: 'Rohan Das', action: 'Supplier added', target: 'BlueTide Travel', category: 'supplier' },
]

export const NOTIFICATIONS: Notification[] = [
  { id: 'n-5', at: iso(0, 9, 21), kind: 'match', title: 'New matches from BlueTide upload', body: 'The latest BlueTide dataset produced new cross-supplier candidates.', read: false, link: 'matching' },
  { id: 'n-4', at: iso(0, 8, 5), kind: 'review', title: 'Matches awaiting verification', body: 'Several property pairs fall between review and auto-match thresholds.', read: false, link: 'matching' },
  { id: 'n-3', at: iso(3, 8, 31), kind: 'upload-failed', title: 'Lotus Holidays upload failed', body: 'lotus_sept.csv is missing a header row. Ask the supplier to resend.', read: false, link: 'studio' },
  { id: 'n-2', at: iso(0, 8, 3), kind: 'optimization', title: 'Optimization complete', body: 'Grand Hyatt Mumbai · Deluxe King: Aurora Bedbank recommended.', read: true, link: 'optimization' },
  { id: 'n-1', at: iso(5, 14, 2), kind: 'system', title: 'Saffron SFTP sync', body: 'Nightly batch from Saffron Direct received.', read: true, link: 'suppliers' },
]

/**
 * Hand-labelled ground truth (listing → real-world property) used to measure
 * matching precision and recall on verified test data.
 */
export const GROUND_TRUTH: Record<string, string> = {
  'A-0001': 'ghm', 'B-0001': 'ghm', 'D-0001': 'ghm', 'E-0001': 'ghm',
  'A-0002': 'tpd', 'B-0002': 'tpd', 'C-0001': 'tpd', 'E-0003': 'tpd',
  'A-0003': 'lpb', 'C-0003': 'lpb', 'E-0002': 'lpb',
  'A-0004': 'njb', 'A-0005': 'njb', 'C-0004': 'njb', 'D-0004': 'njb',
  'A-0006': 'teg', 'B-0004': 'teg',
  'A-0007': 'rbd', 'C-0006': 'rbp',
  'A-0008': 'ram', 'C-0007': 'ram',
  'A-0009': 'lal', 'D-0006': 'lal',
  'A-0010': 'ali', 'D-0007': 'ali', 'D-0008': 'ali',
  'B-0003': 'sun', 'C-0002': 'res',
  'B-0005': 'tri', 'C-0005': 'tri',
  'B-0006': 'itc', 'D-0003': 'itc',
  'B-0007': 'hil', 'D-0005': 'hil',
  'B-0008': 'obe',
  'B-0009': 'roj', 'C-0008': 'roj',
  'D-0002': 'hrm', 'D-0009': 'jwm',
}
