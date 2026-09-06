// טוען את app.json ומזריק אליו ערכים שמגיעים ממשתני סביבה, כדי שמפתחות
// כמו ה-Access Key של Web3Forms לא יישמרו בקוד המקור.
const appJson = require("./app.json");

/** @type {import('@expo/config-types').ExpoConfig} */
module.exports = () => ({
  ...appJson.expo,
  plugins: [...(appJson.expo.plugins ?? []), "expo-tracking-transparency"],
  extra: {
    ...appJson.expo.extra,
    // ניתן להגדיר את המפתח ב-.env מקומי או כ-secret ב-EAS.
    web3formsAccessKey:
      process.env.WEB3FORMS_ACCESS_KEY ??
      process.env.EXPO_PUBLIC_WEB3FORMS_ACCESS_KEY ??
      "",
  },
});
