# surrounds an image url with the opengraph_prefix and opengraph_suffix
module Jekyll::OpenGraphFilter

  # Each method of the module creates a custom Jekyll filter
  def opengraph(input)
    prefix = Jekyll.configuration({})['theme']['image_formats']['opengraph_prefix']
    suffix = Jekyll.configuration({})['theme']['image_formats']['opengraph_suffix']
    "#{prefix}#{input}#{suffix}"
  end
end

Liquid::Template.register_filter(Jekyll::OpenGraphFilter)