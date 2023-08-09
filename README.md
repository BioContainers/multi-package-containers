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

## Searching for containers

Multi-tool containers have hashed names to make them uniquely identifiable.
You usually don't search for containers you construct the hash and pull them down. However, if you have the need to search for them, we have a CLI tool
that helps you.

```
(planemo) bag@bag:~$ mulled-search --destination quay singularity -s deeptools samtools
The query returned the following result(s).
LOCATION     NAME                                                VERSION                                     COMMAND
quay         samtools                                            1.3.1--4                                    docker pull quay.io/biocontainers/samtools:1.3.1--4
quay         samtools                                            1.3.1--3                                    docker pull quay.io/biocontainers/samtools:1.3.1--3
quay         samtools                                            1.3.1--2                                    docker pull quay.io/biocontainers/samtools:1.3.1--2
quay         samtools                                            1.0--0                                      docker pull quay.io/biocontainers/samtools:1.0--0
quay         samtools                                            1.3--1                                      docker pull quay.io/biocontainers/samtools:1.3--1
...
singularity  deeptools                                           3.4.2--py_0                                 wget https://depot.galaxyproject.org/singularity/deeptools:3.4.2--py_0
singularity  deeptools                                           3.4.3--py_0                                 wget https://depot.galaxyproject.org/singularity/deeptools:3.4.3--py_0
singularity  deeptools                                           3.5.0--py_0                                 wget https://depot.galaxyproject.org/singularity/deeptools:3.5.0--py_0
singularity  deeptools                                           3.5.1--py_0                                 wget https://depot.galaxyproject.org/singularity/deeptools:3.5.1--py_0
singularity  deeptools                                           3.5.1--pyhdfd78af_1                         wget https://depot.galaxyproject.org/singularity/deeptools:3.5.1--pyhdfd78af_1
singularity  deeptools                                           3.5.2--pyhdfd78af_0                         wget https://depot.galaxyproject.org/singularity/deeptools:3.5.2--pyhdfd78af_0
...
singularity  samtools                                            1.9--h8571acd_10                            wget https://depot.galaxyproject.org/singularity/samtools:1.9--h8571acd_10
singularity  samtools                                            1.9--h8571acd_11                            wget https://depot.galaxyproject.org/singularity/samtools:1.9--h8571acd_11
singularity  samtools                                            1.9--h8ee4bcc_1                             wget https://depot.galaxyproject.org/singularity/samtools:1.9--h8ee4bcc_1
singularity  samtools                                            1.9--h91753b0_2                             wget https://depot.galaxyproject.org/singularity/samtools:1.9--h91753b0_2
singularity  samtools                                            1.9--h91753b0_3                             wget https://depot.galaxyproject.org/singularity/samtools:1.9--h91753b0_3
singularity  samtools                                            1.9--h91753b0_4                             wget https://depot.galaxyproject.org/singularity/samtools:1.9--h91753b0_4
singularity  samtools                                            1.9--h91753b0_5                             wget https://depot.galaxyproject.org/singularity/samtools:1.9--h91753b0_5
singularity  samtools                                            1.9--h91753b0_8                             wget https://depot.galaxyproject.org/singularity/samtools:1.9--h91753b0_8
...
singularity  mulled-v2-eb9e7907c7a753917c1e4d7a64384c047429618a  9796fae7f3dc33539425911572b1af41da23d71c-0  wget https://depot.galaxyproject.org/singularity/mulled-v2-eb9e7907c7a753917c1e4d7a64384c047429618a:9796fae7f3dc33539425911572b1af41da23d71c-0
singularity  mulled-v2-eb9e7907c7a753917c1e4d7a64384c047429618a  b7b2dac42861f5ad3a6dcbf1626378de27694869-0  wget https://depot.galaxyproject.org/singularity/mulled-v2-eb9e7907c7a753917c1e4d7a64384c047429618a:b7b2dac42861f5ad3a6dcbf1626378de27694869-0
singularity  mulled-v2-eb9e7907c7a753917c1e4d7a64384c047429618a  d4ca6cb58c17558e45d789d552f8d20c2f0cf912-0  wget https://depot.galaxyproject.org/singularity/mulled-v2-eb9e7907c7a753917c1e4d7a64384c047429618a:d4ca6cb58c17558e45d789d552f8d20c2f0cf912-0
singularity  mulled-v2-eb9e7907c7a753917c1e4d7a64384c047429618a  d67d021ff194d58c15cca934dd3dfe948d1c7145-0  wget https://depot.galaxyproject.org/singularity/mulled-v2-eb9e7907c7a753917c1e4d7a64384c047429618a:d67d021ff194d58c15cca934dd3dfe948d1c7145-0
singularity  mulled-v2-eb9e7907c7a753917c1e4d7a64384c047429618a  e4be5f66213daef5a53e2a179b7e0c1d22016afe-0  wget https://depot.galaxyproject.org/singularity/mulled-v2-eb9e7907c7a753917c1e4d7a64384c047429618a:e4be5f66213daef5a53e2a179b7e0c1d22016afe-0
```

## Setting up such a repository

 - Fork this repository or copy the [github workflow](https://github.com/BioContainers/multi-package-containers/blob/master/.github/workflows/ci.yaml).
 - Create quay.io oauth token in an organization.
 - Change the [MULLED_NAMESPACE variable](https://github.com/BioContainers/multi-package-containers/blob/master/.github/workflows/ci.yaml#L4) to point to your quay.io organization.
 - Add QUAY_OAUTH_TOKEN, MY_USER MY_PASSWORD and MY_EMAIL to the repository secrets.
