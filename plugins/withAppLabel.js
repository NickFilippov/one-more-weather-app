// Подпись под иконкой на Android (строка app_name). Поле name в app.json не меняем: из него Expo
// строит имя нативных проектов, и кириллица там не годится. На iOS подпись задаёт CFBundleDisplayName.
const { AndroidConfig, withStringsXml } = require('expo/config-plugins');

module.exports = function withAppLabel(config, { label }) {
  return withStringsXml(config, (mod) => {
    mod.modResults = AndroidConfig.Strings.setStringItem(
      [AndroidConfig.Resources.buildResourceItem({ name: 'app_name', value: label })],
      mod.modResults,
    );
    return mod;
  });
};
