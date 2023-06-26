[![Build image](https://github.com/BioContainers/multi-package-containers/workflows/Build%20image/badge.svg)](https://github.com/BioContainers/multi-package-containers/actions?query=workflow%3A%22Build+image%22)

## Building multiple package Containers

Creating containers is easy! All you need to do is add a combination of packages to the
[hash.tsv file](/combinations/hash.tsv).

To assemble the required string of package combinations you can use the little
[helper service](https://biocontainers.pro/#/multipackage) 
which we provide for you. This service will also tell you the name of the container that will be created.

Currently, this will create you Docker and rkt containers hosted at https://quay.io/organization/biocontainers and 
Singularity images hosted at https://depot.galaxyproject.org/singularity/ (Hosting sponsors and mirrors welcome!).

## Associated command line tools

You can list and search for existing conda packages and container images as well as build multi-package container images locally 
using the command line `mulled-*` tools available as part of [`galaxy-tool-util`](https://pypi.org/project/galaxy-tool-util/), which source
code is hosted as part of the [Galaxy repo](https://github.com/galaxyproject/galaxy/tree/dev/lib/galaxy/tool_util/).
These can be installed using conda 

```
conda create -n mulled galaxy-tool-util -c conda-forge -c bioconda
conda activate mulled
```

## Setting up such a repository

 - Fork this repository or copy the [github workflow](https://github.com/BioContainers/multi-package-containers/blob/master/.github/workflows/ci.yaml).
 - Create quay.io oauth token in an organization.
 - Change the [MULLED_NAMESPACE variable](https://github.com/BioContainers/multi-package-containers/blob/master/.github/workflows/ci.yaml#L4) to point to your quay.io organization.
 - Add QUAY_OAUTH_TOKEN, MY_USER MY_PASSWORD and MY_EMAIL to the repository secrets.
