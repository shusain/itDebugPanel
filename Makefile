app_dir = /var/www/project-template

deploy :
	sudo mkdir -p $(app_dir)
	sudo cp -R ./dist/ $(app_dir)/
