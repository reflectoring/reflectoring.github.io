if [ "{$HUGO_ENV}" == "production" ]; then
  export BASE_URL = "https://reflectoring.io"
else
  export BASE_URL = "${DEPLOY_PRIME_URL}"
endif