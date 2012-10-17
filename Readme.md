Terrain Profile
===============

Leveraging Google Maps elevation data for a simple webapp, see
<http://geo.ebp.ch/gelaendeprofil>.

Features
========

* Create a terrain profile within seconds
* Use it with routing (car, pedestrian, bike (where available))
* One standalone HTML page
* Available in German, French and English
* [...] 

Installation
============

* Install Python and `jinja2` 
* Run `generate.py`, 
* The resulting index_de.html, index_fr.html or index_en.html can be used on the filesystem or copied to your webserver.


Add a new language
==================

* Run `pybabel-script.py init -i .\i18n\test.pot -d i18n\ -l <your language code>`, the language code is `en` for english, `fr` for french...,
* Go to `TerrainProfile\i18n\<your language code>\LC_MESSAGES` and open the file messages.po,
* Remove the 6th line saying `#, fuzzy`
* For each message to translate there is a couple msgid, msgstr. The msgid is the german sentence to translate. Enter the translation as the msgstr,
* Then you must compile the .po file. To do so just run the command `pybabel-script.py compile -d i18n\` which will compile everything,
* Run `generate.py`.

Modify `template.html`
======================

* In case you want to modify the text in the template, you must add the text this way: `{{ gettext(<you text>)}}`,
* Then you need to update the .pot file: `pybabel-script.py extract . -F config.ini -o i18n\test.pot`,
* And update the .po file: `pybabel-script.py update -i .\i18n\test.pot -d i18n\ -l <all language code> --previous true`,
* Finally run `generate.py`.

Todos
=====

* maybe: refactor with jquery
* UI: delete individual markers

Authors
======

* Stephan Heuel, Ernst Basler + Partner
* Hedi Radhouane, Ernst Basler + Partner