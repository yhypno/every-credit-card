// lib/cardCategories.js

export function getCardCategory(firstBlock) {
    // Convert to number if it's a string
    const block = Number(firstBlock);
  
    const mappings = [
      { range: [0, 0], category: "ISO/TC 68 and other industry assignments 🏭" },
      { range: [10, 10], category: "ANA mileage cards 🎁" },
      { range: [11, 12], category: "Airlines ✈️" },
      { range: [13, 13], category: "Odeon Première Club ♣️" },
      { range: [14, 14], category: "Lounge Club Airport 🎁" },
      { range: [15, 16], category: "Airlines ✈️" },
      { range: [17, 17], category: "PAG Airways UATP card 🎁" },
      { range: [18, 19], category: "Airlines ✈️" },
      { range: [20, 20], category: "Diners Club International 💳" },
      { range: [20, 29], category: "Airlines ✈️ and other future industry assignments" },
      { range: [30, 30], category: "Diners Club and others 💳" },
      { range: [31, 31], category: "Banking/Financial 💳" },
      { range: [32, 34], category: "Travel and entertainment 🎉" },
      { range: [35, 35], category: "JCB 💳" },
      { range: [36, 36], category: "Diners Club International 💳" },
      { range: [37, 37], category: "American Express 💳" },
      { range: [38, 39], category: "Banking/Financial 💳" },
      { range: [40, 49], category: "Visa 💳" },
      { range: [50, 50], category: "Banking/Financial 💳" },
      { range: [51, 55], category: "Mastercard 💳" },
      { range: [56, 56], category: "Maestro 💳" },
      { range: [57, 59], category: "Banking/Financial 💳" },
      { range: [60, 61], category: "Merchandising and Banking" },
      { range: [62, 62], category: "China UnionPay 💳" },
      { range: [63, 64], category: "Merchandising and Banking" },
      { range: [65, 65], category: "Discover 💳" },
      { range: [66, 66], category: "Merchandising and Banking" },
      { range: [67, 67], category: "Maestro 💳" },
      { range: [69, 69], category: "Merchandising and Banking" },
      { range: [70, 79], category: "Petroleum and Future Industry 🛢️" },
      { range: [80, 88], category: "Healthcare and Telecommunications 🩺" },
      { range: [89, 89], category: "Telecommunications 🗼" },
      { range: [90, 99], category: "National Assignment 🇺🇸" }
    ];
  
    for (const { range, category } of mappings) {
      if (block >= range[0] && block <= range[1]) {
        return category;
      }
    }
  
    return "Unknown Category";
  }
