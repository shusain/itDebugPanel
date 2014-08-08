staging_dir = /var/www/intellectual-tech/staging/project-template
production_dir = /var/www/project-template

deploy_staging :
	sudo rm -rf $(staging_dir)
	sudo mkdir -p $(staging_dir)
	sudo cp -R dist/* $(staging_dir)/
	sudo chown -R ubuntu:developers $(staging_dir)

deploy_production :
	sudo rm -rf $(production_dir)
	sudo mkdir -p $(production_dir)
	sudo cp -R dist/* $(production_dir)/
	sudo chown -R ubuntu:developers $(production_dir)
