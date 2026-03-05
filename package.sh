#!/bin/bash
echo "Creating PortalRefound.zip..."
rm -f PortalRefound.zip
zip -r PortalRefound.zip . \
  -x "*.DS_Store" \
  -x "__MACOSX" -x "__MACOSX/*" \
  -x ".git/*" -x ".idea/*" \
  -x "package.sh" -x "*.zip" -x "*.xpi" \
  -x "Portail.html" -x "Portail_files/*" \
  -x "Tableau de bord _ Moodle HENALLUX.html" -x "Tableau de bord _ Moodle HENALLUX_files/*"
echo "Done. Upload PortalRefound.zip to AMO (addons.mozilla.org)."
