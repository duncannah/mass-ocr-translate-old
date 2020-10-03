# mass-ocr-translate

Tool to translate sets of images with text (eg. manga, cg set) using OCR and machine translation without knowledge of the original language.

This tool is extremely experimental; it's not meant to be run 24/7, and it might just end up not working.

## Translation services

This tool makes use of the following services, free of charge: Google Translate, DeepL, Yandex Translate, and Microsoft Translator.

## Prerequisites

You'll need to get a Google API key (for free), which is connected to a Google account to be able to use OCR.

1. Go to https://developers.google.com/drive/api/v3/quickstart/nodejs
2. Click the "ENABLE THE DRIVE API" button
3. Click the "DOWNLOAD CLIENT CONFIGURATION" button and save the file in a folder named `.auth` in the tool's directory.

After that, you can use the tool. You'll need to only do this once. If it's your first time, you'll need to authenticate the tool to access your Drive by following the instructions given by the tool in the terminal.

## Price of OCR

OCR is free of charge using the Google Drive API, which has a daily quota of 5 million requests, which is way more than enough for our purposes.

## License

This software is licensed under AGPL 3.0; a copy can be found under [LICENSE](LICENSE).
