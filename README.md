[![Build Status](https://travis-ci.com/BioContainers/multi-package-containers.svg?branch=master)](https://travis-ci.com/BioContainers/multi-package-containers)

## Building multiple package Containers

Create a container is easy! All what you need to do is add a combination of packages to the
[hash.tsv file](https://github.com/BioContainers/multi-package-containers/blob/master/combinations/hash.tsv).

To assemble the required string of package combinations you can use the little
[helper service](https://biocontainers.pro/#/multipackage) 
which we provide for you. This service will also tell you the name of the container that will be created.

Currently, this will create you Docker and rkt containers hosted at https://quay.io/organization/biocontainers and 
Singularity images hosted at https://depot.galaxyproject.org/singularity/ (Hosting sponsors and mirrors welcome!).

## Associated command line tools

You can list and search for existing conda packages and container images as well as build multi-package container images locally 
using the command line `mulled-*` tools avialable as part of [`galaxy-tool-util`](https://pypi.org/project/galaxy-tool-util/) 
These can be installed using conda 

```
conda create -n mulled galaxy-tool-util -c conda-forge -c bioconda
conda activate mulled
```

## Setting up such a repository

 - Create repository and register with Travis.
 - Create quay.io oauth token in an organization.
 - Copy Travis file as an example, remove secure environment variables.
 - travis encrypt QUAY_OAUTH_TOKEN=<token> --add env.global
 - travis encrypt INVOLUCRO_AUTH="https://<username>:<password>@quay.io/v1/" --add env.global
