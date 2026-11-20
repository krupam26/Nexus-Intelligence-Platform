import type { Offer, UnifiedProperty } from '../types'

const STD = ['Free WiFi', 'Air conditioning', 'Minibar', 'Safe', 'Coffee machine']

export const PROPERTIES: UnifiedProperty[] = [
  {
    id: 'P-GHM', name: 'Grand Hyatt Mumbai', city: 'Mumbai', stars: 5, listingIds: ['A-0001', 'B-0001', 'D-0001'],
    categories: [
      { id: 'dk', label: 'Deluxe King', roomType: 'Deluxe', bed: 'King', capacity: 2, sizeSqm: 40, view: 'City', amenities: [...STD, 'Rain shower'] },
      { id: 'gs', label: 'Grand Suite', roomType: 'Suite', bed: 'King', capacity: 3, sizeSqm: 86, view: 'City', amenities: [...STD, 'Living room', 'Bathtub', 'Club access'] },
    ],
  },
  {
    id: 'P-TPD', name: 'Taj Palace, New Delhi', city: 'New Delhi', stars: 5, listingIds: ['A-0002', 'B-0002', 'C-0001'],
    categories: [
      { id: 'sr', label: 'Superior Room', roomType: 'Superior', bed: 'King', capacity: 2, sizeSqm: 36, view: 'Garden', amenities: [...STD, 'Bathtub'] },
      { id: 'tc', label: 'Taj Club Room', roomType: 'Club', bed: 'Twin', capacity: 2, sizeSqm: 42, view: 'Pool', amenities: [...STD, 'Club access', 'Bathtub'] },
    ],
  },
  {
    id: 'P-LPB', name: 'The Leela Palace Bengaluru', city: 'Bengaluru', stars: 5, listingIds: ['A-0003', 'C-0003'],
    categories: [
      { id: 'pr', label: 'Premier Room', roomType: 'Premier', bed: 'King', capacity: 2, sizeSqm: 48, view: 'Garden', amenities: [...STD, 'Butler service', 'Bathtub'] },
    ],
  },
  {
    id: 'P-NJB', name: 'Novotel Mumbai Juhu Beach', city: 'Mumbai', stars: 5, listingIds: ['A-0004', 'C-0004', 'D-0004', 'A-0005'],
    categories: [
      { id: 'ss', label: 'Superior Sea View', roomType: 'Superior', bed: 'Queen', capacity: 2, sizeSqm: 30, view: 'Sea', amenities: [...STD] },
    ],
  },
]

type O = Omit<Offer, 'id'>
const offers: O[] = [
  // Grand Hyatt Mumbai — Deluxe King
  { propertyId: 'P-GHM', supplierId: 'SUP-A', categoryId: 'dk', roomName: 'Deluxe King Room', roomType: 'Deluxe', bed: 'King', capacity: 2, sizeSqm: 40, view: 'City', amenities: [...STD, 'Rain shower'], mealPlan: 'Breakfast included', refundable: true, cancelDeadlineHrs: 48, cancelChargePct: 0, taxesIncluded: true, extraCharges: [], price: 12000, availability: 6 },
  { propertyId: 'P-GHM', supplierId: 'SUP-B', categoryId: 'dk', roomName: 'King Deluxe - City View', roomType: 'Deluxe', bed: 'King', capacity: 2, sizeSqm: 40, view: 'City', amenities: [...STD, 'Rain shower'], mealPlan: 'Breakfast included', refundable: false, cancelDeadlineHrs: null, cancelChargePct: 100, taxesIncluded: true, extraCharges: [], price: 11500, availability: 12 },
  { propertyId: 'P-GHM', supplierId: 'SUP-D', categoryId: 'dk', roomName: 'Deluxe Room 1 King Bed', roomType: 'Deluxe', bed: 'King', capacity: 2, sizeSqm: null, view: null, amenities: ['WiFi', 'AC', 'Minibar'], mealPlan: 'Room only', refundable: true, cancelDeadlineHrs: 24, cancelChargePct: 50, taxesIncluded: false, extraCharges: ['Resort fee ₹750'], price: 13000, availability: 3 },
  // Grand Hyatt Mumbai — Grand Suite
  { propertyId: 'P-GHM', supplierId: 'SUP-A', categoryId: 'gs', roomName: 'Grand Suite King', roomType: 'Suite', bed: 'King', capacity: 3, sizeSqm: 86, view: 'City', amenities: [...STD, 'Living room', 'Bathtub', 'Club access'], mealPlan: 'Breakfast included', refundable: true, cancelDeadlineHrs: 72, cancelChargePct: 0, taxesIncluded: true, extraCharges: [], price: 31500, availability: 2 },
  { propertyId: 'P-GHM', supplierId: 'SUP-B', categoryId: 'gs', roomName: 'Executive Suite', roomType: 'Suite', bed: 'King', capacity: 2, sizeSqm: 64, view: 'City', amenities: [...STD, 'Living room'], mealPlan: 'Breakfast included', refundable: true, cancelDeadlineHrs: 48, cancelChargePct: 25, taxesIncluded: true, extraCharges: [], price: 26800, availability: 4 },
  { propertyId: 'P-GHM', supplierId: 'SUP-D', categoryId: 'gs', roomName: 'Grand Suite', roomType: 'Suite', bed: 'King', capacity: 3, sizeSqm: 86, view: 'City', amenities: [...STD, 'Living room', 'Bathtub', 'Club access'], mealPlan: 'Half board', refundable: true, cancelDeadlineHrs: 48, cancelChargePct: 0, taxesIncluded: false, extraCharges: [], price: 29900, availability: null },
  // Taj Palace — Superior
  { propertyId: 'P-TPD', supplierId: 'SUP-A', categoryId: 'sr', roomName: 'Superior Room King Garden View', roomType: 'Superior', bed: 'King', capacity: 2, sizeSqm: 36, view: 'Garden', amenities: [...STD, 'Bathtub'], mealPlan: 'Breakfast included', refundable: true, cancelDeadlineHrs: 24, cancelChargePct: 0, taxesIncluded: false, extraCharges: [], price: 14200, availability: 5 },
  { propertyId: 'P-TPD', supplierId: 'SUP-B', categoryId: 'sr', roomName: 'Superior King', roomType: 'Superior', bed: 'King', capacity: 2, sizeSqm: 36, view: 'Garden', amenities: [...STD, 'Bathtub'], mealPlan: 'Breakfast included', refundable: true, cancelDeadlineHrs: 24, cancelChargePct: 0, taxesIncluded: false, extraCharges: [], price: 14650, availability: 9 },
  { propertyId: 'P-TPD', supplierId: 'SUP-C', categoryId: 'sr', roomName: 'Superior Room - Twin', roomType: 'Superior', bed: 'Twin', capacity: 2, sizeSqm: 36, view: 'City', amenities: [...STD], mealPlan: 'Room only', refundable: true, cancelDeadlineHrs: 72, cancelChargePct: 0, taxesIncluded: true, extraCharges: [], price: 13100, availability: 8 },
  // Taj Palace — Club
  { propertyId: 'P-TPD', supplierId: 'SUP-A', categoryId: 'tc', roomName: 'Taj Club Room Twin', roomType: 'Club', bed: 'Twin', capacity: 2, sizeSqm: 42, view: 'Pool', amenities: [...STD, 'Club access', 'Bathtub'], mealPlan: 'Breakfast included', refundable: true, cancelDeadlineHrs: 48, cancelChargePct: 0, taxesIncluded: true, extraCharges: [], price: 21500, availability: 3 },
  { propertyId: 'P-TPD', supplierId: 'SUP-C', categoryId: 'tc', roomName: 'Club Room Pool View', roomType: 'Club', bed: 'Twin', capacity: 2, sizeSqm: 42, view: 'Pool', amenities: [...STD, 'Club access', 'Bathtub'], mealPlan: 'Breakfast included', refundable: true, cancelDeadlineHrs: 48, cancelChargePct: 0, taxesIncluded: true, extraCharges: [], price: 20900, availability: 6 },
  // Leela — Premier
  { propertyId: 'P-LPB', supplierId: 'SUP-A', categoryId: 'pr', roomName: 'Premier Room Garden View', roomType: 'Premier', bed: 'King', capacity: 2, sizeSqm: 48, view: 'Garden', amenities: [...STD, 'Butler service', 'Bathtub'], mealPlan: 'Breakfast included', refundable: true, cancelDeadlineHrs: 48, cancelChargePct: 0, taxesIncluded: true, extraCharges: [], price: 16800, availability: 4 },
  { propertyId: 'P-LPB', supplierId: 'SUP-C', categoryId: 'pr', roomName: 'Premier King', roomType: 'Premier', bed: 'King', capacity: 2, sizeSqm: 48, view: 'Pool', amenities: [...STD, 'Butler service'], mealPlan: 'Half board', refundable: true, cancelDeadlineHrs: 24, cancelChargePct: 50, taxesIncluded: true, extraCharges: [], price: 18400, availability: 7 },
  // Novotel Juhu — Superior Sea View
  { propertyId: 'P-NJB', supplierId: 'SUP-A', categoryId: 'ss', roomName: 'Superior Room Sea View Queen', roomType: 'Superior', bed: 'Queen', capacity: 2, sizeSqm: 30, view: 'Sea', amenities: [...STD], mealPlan: 'Room only', refundable: true, cancelDeadlineHrs: 24, cancelChargePct: 0, taxesIncluded: true, extraCharges: [], price: 9800, availability: 10 },
  { propertyId: 'P-NJB', supplierId: 'SUP-C', categoryId: 'ss', roomName: 'Sea Facing Superior', roomType: 'Superior', bed: 'Queen', capacity: 2, sizeSqm: 30, view: 'Sea', amenities: [...STD], mealPlan: 'Breakfast included', refundable: true, cancelDeadlineHrs: 48, cancelChargePct: 0, taxesIncluded: true, extraCharges: [], price: 10900, availability: 5 },
  { propertyId: 'P-NJB', supplierId: 'SUP-D', categoryId: 'ss', roomName: 'Superior Room', roomType: 'Superior', bed: null, capacity: 2, sizeSqm: 28, view: 'Partial sea', amenities: ['WiFi', 'AC'], mealPlan: 'Room only', refundable: false, cancelDeadlineHrs: null, cancelChargePct: 100, taxesIncluded: false, extraCharges: [], price: 8600, availability: 2 },
]

export const OFFERS: Offer[] = offers.map((o, i) => ({ ...o, id: `OF-${String(i + 1).padStart(3, '0')}` }))
