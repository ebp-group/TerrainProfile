# -*- coding: utf-8 -*-

import codecs
import jinja2
from jinja2.ext import i18n
import base64
import os
import babel
from babel.support import Translations
import gettext

class GeneratorStandaloneHTML(object):
    """This is a simple class which generates a standalone HTML from a
    Jinja2 template and a set of resources (css, js, images).
    """

    def __init__(self,standalone = True, encoding = "utf-8"):
        self.standalone = standalone
        self.encoding = encoding
        self.jinja2_env = jinja2.Environment(loader=jinja2.FileSystemLoader('.', encoding=self.encoding),
                                extensions=['jinja2.ext.i18n'])

        self.jinja2_env.filters["include_css"] = self.include_css
        self.jinja2_env.filters["include_js"]  = self.include_js
        self.jinja2_env.filters["imgsrc"]      = self.imgsrc

    def include_css(self,filename):
        if self.standalone:
            with codecs.open(filename, "r", encoding=self.encoding) as css_file:
                return '<style type="text/css">%s</style>' % css_file.read()
        else:
            return '<link type="text/css"  rel="stylesheet" href="%s"></link>' % filename

    def include_js(self,filename):
        if self.standalone:
            with codecs.open(filename, "r", encoding=self.encoding) as js_file:
                return '<script type="text/javascript">%s</script>' % js_file.read()
        else:
            return '<script type="text/javascript" src="%s"></script>' % filename

    def imgsrc(self,filename):
        (no_ext, ext) = os.path.splitext(filename)
        if self.standalone:
            with open(filename, "rb") as image_file:
                base64data = base64.b64encode(image_file.read())
                return "data:image/%s;base64,%s" % (ext[1:], base64data)
        else:
            return filename
        

    def start(self,in_template, out_html):
        template = self.jinja2_env.get_template(in_template)
        gettext.install('messages', '.\i18n')
        
        for name in os.listdir("i18n/"):
            if(os.path.isdir("i18n/"+name)):
                translation = gettext.translation("messages", ".\i18n", languages=[name])
                translation.install()
                self.jinja2_env.install_gettext_translations(translation)
                f = codecs.open(out_html+name+".html", "w", encoding=self.encoding)
                f.write(template.render({ "standalone" : self.standalone}))
                print "generated the langage with code " + name
        
        f.close()


# command line interface
if __name__ == "__main__":
    generator = GeneratorStandaloneHTML()
    generator.start("template.html","index_")
