---
name: add_form_block
description: >
  Add a form block to a page and wire its submit event to the tracking contract.
  Trigger words: add form, create form, form block, lead form, contact form, signup form.
metadata:
  version: "1.0.0"
  category: build
  domain: marketing-engineering
compatibility:
  - claude-code
  - cursor
  - gemini-cli
---

# Add Form Block

## PURPOSE
Add a form block to an existing page. The form includes labeled fields, validation attributes, a submit button, and a `data-tracking-event` attribute that connects it to the tracking contract.

## INPUTS
- **page_path** (required): Path to the existing HTML page file
- **form_name** (required): Name for the form (e.g., "lead-capture", "contact", "signup")
- **fields** (required): Array of field definitions: `{ name, type, label, required?, placeholder? }`
  - Allowed field types: `text`, `email`, `tel`, `number`, `select`, `textarea`, `checkbox`, `hidden`
- **submit_text** (optional): Submit button text (default: "Submit")
- **tracking_event** (optional): Event name for the tracking contract (default: `form_submit`)
- **position** (optional): Where to insert — `before:{block_id}`, `after:{block_id}`, or `end` (default: `end`)

## PRECONDITIONS
1. The target page file exists and has a `<main>` element
2. All field types are in the allowed list
3. At least one field is defined
4. The form_name is unique within the page (no duplicate form names)

## ALLOWED CHANGES
- Insert one `<section>` with a `<form>` element into the page
- Add `data-block-type="form"`, `data-tracking-event="{event}"`, and `data-testid` attributes
- Add form fields with proper labels, IDs, names, and validation attributes
- Add a submit button

## FORBIDDEN CHANGES
- Do NOT add JavaScript form handlers or validation scripts
- Do NOT add CSS/styles
- Do NOT add `action` or `method` attributes (runtime handles submission)
- Do NOT modify existing blocks or page structure
- Do NOT add external dependencies

## PROCEDURE
1. **Read Page**: Load the target HTML file
2. **Validate Fields**: Check each field type against the allowed list
3. **Check Uniqueness**: Ensure no existing form has the same `data-form-name`
4. **Generate Block ID**: `form-{short_uuid}`
5. **Build Form HTML**:
   a. `<section data-block-id="{id}" data-block-type="form" data-testid="form-block">`
   b. `<form data-form-name="{form_name}" data-tracking-event="{tracking_event}">`
   c. For each field:
      - `<label for="{field.name}">{field.label}</label>`
      - Input element with `id="{field.name}"`, `name="{field.name}"`, `type="{field.type}"`
      - Add `required` attribute if `field.required` is true
      - Add `placeholder` if provided
      - For `select`: add `<option>` elements from `field.options`
      - For `textarea`: use `<textarea>` element
      - For `checkbox`: wrap in label with text
   d. `<button type="submit" data-testid="form-submit">{submit_text}</button>`
   e. Close form and section
6. **Insert at Position**: Place in `<main>` at specified position
7. **Write File**: Save the modified page
8. **Report**: List fields and tracking event

## COMMANDS TO RUN
```bash
# Verify page exists
test -f "{page_path}" && echo "Page found" || echo "ERROR: Page not found"

# After insertion, verify form exists
grep -c 'data-form-name="{form_name}"' "{page_path}" && echo "Form inserted" || echo "ERROR: Form not found"
```

## OUTPUT FORMAT
```
INSERTED form block into pages/landing.html
  Block ID:       form-e5f6g7h8
  Form Name:      lead-capture
  Fields:         name (text), email (email, required), company (text), message (textarea)
  Submit:         "Get Started"
  Tracking Event: form_submit
  Selectors:      [data-testid='form-block'], [data-testid='form-submit']
```

## STOP CONDITIONS
- STOP if the page file does not exist
- STOP if zero fields are provided
- STOP if any field type is not in the allowed list
- STOP if a form with the same name already exists in the page
- STOP if the page has no `<main>` element

## FAILURE HANDLING
- If an invalid field type is given, list all allowed types
- If the form name conflicts, list existing form names
- If the page can't be parsed, report the structure issue
- Never create a form without at least one field
