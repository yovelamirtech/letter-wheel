// טוען את app.json. ה-Access Key של Web3Forms נטען מ-extra.web3formsAccessKey
// שב-app.json (מפתח ציבורי לפי עיצוב Web3Forms - ראו .env.example), עם אפשרות
// לדרוס אותו ממשתנה סביבה מקומי או מ-secret ב-EAS בלי לגעת בקוד.
const appJson = require("./app.json");

/** @type {import('@expo/config-types').ExpoConfig} */
module.exports = () => ({
  ...appJson.expo,
  extra: {
    ...appJson.expo.extra,
    web3formsAccessKey:
      process.env.WEB3FORMS_ACCESS_KEY ??
      process.env.EXPO_PUBLIC_WEB3FORMS_ACCESS_KEY ??
      appJson.expo.extra?.web3formsAccessKey ??
      "",
  },
});
