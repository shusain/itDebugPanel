app_dir = /var/www/project-template

deploy :
	sudo rm -rf $(app_dir)
	sudo mkdir -p $(app_dir)
	sudo cp -R dist/* $(app_dir)/
