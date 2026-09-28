const APP_VERSION = '1.0.0';
const APK_DOWNLOAD_URL = 'https://pirganj-app.netlify.app/apk';

function getVersionPayload() {
  return { version: APP_VERSION, downloadUrl: APK_DOWNLOAD_URL };
}

module.exports = { APP_VERSION, APK_DOWNLOAD_URL, getVersionPayload };
