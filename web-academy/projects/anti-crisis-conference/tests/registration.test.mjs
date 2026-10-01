import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const scriptUrl = new URL("../script.js", import.meta.url);
const scriptSource = fs.readFileSync(scriptUrl, "utf8");
const context = {
  document: {
    querySelector: () => null,
  },
  window: {
    __ANTI_CRISIS_TEST__: true,
  },
};

vm.runInNewContext(scriptSource, context, { filename: scriptUrl.pathname });

const {
  getTildaPhoneValue,
  isPlausibleInternationalPhone,
  normalizePhoneToE164,
} = context.window.__antiCrisisRegistrationHelpers;

assert.equal(normalizePhoneToE164("8 (999) 123-45-67"), "+79991234567");
assert.equal(normalizePhoneToE164("9991234567"), "+79991234567");
assert.equal(normalizePhoneToE164("+7 999 123 45 67"), "+79991234567");
assert.equal(normalizePhoneToE164("771 123-45-67", "7"), "+77711234567");
assert.equal(normalizePhoneToE164("00375 29 123-45-67"), "+375291234567");
assert.equal(normalizePhoneToE164("29 123-45-67", "375"), "+375291234567");
assert.equal(normalizePhoneToE164("90 123-45-67", "998"), "+998901234567");
assert.equal(normalizePhoneToE164(""), "");
assert.equal(getTildaPhoneValue(""), "");
assert.equal(getTildaPhoneValue("+7 (999) 123-45-67"), "9991234567");
assert.equal(getTildaPhoneValue("+7 (771) 123-45-67"), "7711234567");
assert.equal(getTildaPhoneValue("+375 (29) 123-45-67"), "+375291234567");
assert.equal(getTildaPhoneValue("+998 (90) 123-45-67"), "+998901234567");
assert.equal(isPlausibleInternationalPhone("+7 (771) 123-45-67"), true);
assert.equal(isPlausibleInternationalPhone("+375 (29) 123-45-67"), true);
assert.equal(isPlausibleInternationalPhone("+998 (90) 123-45-67"), true);
assert.equal(isPlausibleInternationalPhone("+49 15123456789"), true);
assert.equal(isPlausibleInternationalPhone("+7 123"), false);
assert.equal(isPlausibleInternationalPhone(`+${"1".repeat(16)}`), false);

console.log("intl-tel-input registration helpers: ok");
