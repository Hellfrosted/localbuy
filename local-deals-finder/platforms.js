/**
 * Platform configurations for Local Deals Finder
 */

const PLATFORMS = [
  {
    id: 'facebook',
    name: 'Facebook Marketplace',
    icon: '📘',
    buildUrl: (query, zip, radius) => {
      const radiusMap = { 5: 8, 10: 16, 25: 40, 50: 80, 100: 161 };
      return `https://www.facebook.com/marketplace/category/search/?query=${encodeURIComponent(query)}&radius=${radiusMap[radius] || 40}`;
    },
    requiresLogin: true
  },
  {
    id: 'craigslist',
    name: 'Craigslist',
    icon: '📝',
    buildUrl: (query, zip, radius) => {
      return `https://craigslist.org/search/sss?query=${encodeURIComponent(query)}&postal=${zip}&search_distance=${radius}`;
    },
    requiresLogin: false
  },
  {
    id: 'offerup',
    name: 'OfferUp',
    icon: '🏷️',
    buildUrl: (query, zip, radius) => {
      return `https://offerup.com/search?q=${encodeURIComponent(query)}&radius=${radius}&delivery_param=all&postal=${zip}`;
    },
    requiresLogin: false
  },
  {
    id: 'mercari',
    name: 'Mercari',
    icon: '🛍️',
    buildUrl: (query, zip, radius) => {
      return `https://www.mercari.com/search/?keyword=${encodeURIComponent(query)}`;
    },
    requiresLogin: false
  },
  {
    id: 'govdeals',
    name: 'GovDeals',
    icon: '🏛️',
    buildUrl: (query, zip, radius) => {
      return `https://www.govdeals.com/index.cfm?fa=Main.AdvSearch&searchtext=${encodeURIComponent(query)}&zipcode=${zip}&miles=${radius}`;
    },
    requiresLogin: false
  },
  {
    id: 'ebay',
    name: 'eBay Local',
    icon: '🛒',
    buildUrl: (query, zip, radius) => {
      return `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&LH_PrefLoc=99&_stpos=${zip}&_sadis=${radius}`;
    },
    requiresLogin: false
  },
  {
    id: 'nextdoor',
    name: 'Nextdoor',
    icon: '🏠',
    buildUrl: (query, zip, radius) => {
      return `https://nextdoor.com/for_sale_and_free/?query=${encodeURIComponent(query)}`;
    },
    requiresLogin: true
  }
];
