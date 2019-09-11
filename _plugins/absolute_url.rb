module Jekyll::CustomAbsoluteUrlFilter

  # Each method of the module creates a custom Jekyll filter
  def absolute_url(input)
    url = Jekyll.configuration({})['url'].gsub(/\/$/, '')
    input = input.gsub(/^\//, '')
    "#{url}/#{input}"
  end
end

Liquid::Template.register_filter(Jekyll::CustomAbsoluteUrlFilter)