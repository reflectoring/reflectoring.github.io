# surrounds an image url with the teaser_prefix and teaser_suffix
module Jekyll::TeaserFilter

  # Each method of the module creates a custom Jekyll filter
  def teaser(input)
    prefix = Jekyll.configuration({})['theme']['image_formats']['teaser_prefix']
    suffix = Jekyll.configuration({})['theme']['image_formats']['teaser_suffix']
    "#{prefix}#{input}#{suffix}"
  end
end

Liquid::Template.register_filter(Jekyll::TeaserFilter)