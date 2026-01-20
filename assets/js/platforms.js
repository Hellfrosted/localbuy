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
      return `https://www.facebook.com/marketplace/search/?query=${encodeURIComponent(query)}&daysSinceListed=1&radius=${radiusMap[radius] || 40}`;
    },
    requiresLogin: true
  },
  {
    id: 'craigslist',
    name: 'Craigslist (via SearchTempest)',
    icon: '📝',
    buildUrl: (query, zip, radius) => {
      return `https://www.searchtempest.com/search?search_string=${encodeURIComponent(query)}&category=8&subcat=sss&cityselect=zip&location=${zip}&maxDist=${radius}#gsc.tab=0`;
    },
    requiresLogin: false
  },
  {
    id: 'offerup',
    name: 'OfferUp',
    icon: '🏷️',
    buildUrl: (query, zip, radius) => {
      return `https://offerup.com/search/?q=${encodeURIComponent(query)}`;
    },
    requiresLogin: false
  },


  {
    id: 'ebay',
    name: 'eBay Local Pickup',
    icon: '🛒',
    buildUrl: (query, zip, radius) => {
      return `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&_stpos=${zip}&_sadis=${radius}&LH_LPickup=1`;
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
