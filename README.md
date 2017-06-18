## Building multiple package Containers

Create a container is easy! All what you need to do is add a combination of packages to the
[hash.tsv file](https://github.com/BioContainers/multi-package-containers/blob/master/combinations/hash.tsv).

To assemble the required string of package combinations you can use the little
[helper service](http://biocontainers.pro/multi-package-containers
) which we provide for you. This service will also tell you the name of the container that will be created.

Currently, this will create you Docker and rkt containers hosted at https://quay.io/organization/biocontainers and Singularity images temporary hosted at http://192.52.2.34 (Hosting sponsors welcome!).

## Setting up such a repository

 - Create repository and register with Travis.
 - Create quay.io oauth token in an organization.
 - Copy Travis file as an example, remove secure environment variables.
 - travis encrypt QUAY_OAUTH_TOKEN=<token> --add env.global
 - travis encrypt INVOLUCRO_AUTH="https://<username>:<password>@quay.io/v1/" --add env.global
