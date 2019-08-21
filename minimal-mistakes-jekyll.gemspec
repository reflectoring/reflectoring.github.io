# coding: utf-8

Gem::Specification.new do |spec|
  spec.name                    = "reflectoring"
  spec.version                 = "1.0.0"
  spec.authors                 = ["Tom Hombergs"]

  spec.summary                 = "reflectoring blog"
  spec.homepage                = "https://reflectoring.io"
  spec.license                 = "MIT"

  spec.metadata["plugin_type"] = "theme"

  spec.files                   = `git ls-files -z`.split("\x0").select do |f|
    f.match(%r{^(assets|_(includes|layouts|sass)/|(LICENSE|README|CHANGELOG)((\.(txt|md|markdown)|$)))}i)
  end

  spec.add_runtime_dependency "jekyll", "~> 3.8"
  spec.add_runtime_dependency "jekyll-paginate-v2", "~> 1.7"
  spec.add_runtime_dependency "jekyll-sitemap", "~> 1.0"

  spec.add_development_dependency "bundler", "~> 2.0.1"
  spec.add_development_dependency "rake", "~> 12.0"
  spec.add_development_dependency "html-proofer", "3.3.1"
end
