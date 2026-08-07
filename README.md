# resume-editor

`resume-editor` is a client only webapp to create, update, and export resume based on opiniated preset.

## Features

- One page UI
- Create resume through form
- Import resume json from previous created resume to edit
- Export resume to pdf as a product, and json as a data for editing
- Resume can be exported in English or Indonesia as user selected

## Feature Breakdown

### One Page UI

This app should only has one page without routing. The page contains two panels:

1. Left Panel: Form section where user input their information, it also contain navigation to jump into specific information.
2. Right Panel: Preview section for realtime result that may be exported as pdf. This panel also contain import and export buttons.

### Create resume through form

This app can deliver experience for user to simply create their resume. The detail about what information will need to fill by user will be provided later.

### Import resume json and edit

This app can handle edit resume that created by this app before using the json that exported with pdf. When user import their json, it will automatically fill the form and ready to edit.

### Export resume to pdf and json

This app mainly used for generating pdf resume. So the product goal of this app is exporting it to pdf format. However, for more user experience, the export will include the `resume.json` to easly edit it later.

### Resume language

Resume that generated from this app can have english and indonesia. User need fill both form to make this happen.

## Project Structure

Main project source code is located in `src` folder.