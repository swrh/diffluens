diffluens
=========

A calendar app built with Django to extend the Redmine time sheet.

Quick, lazy and unsafe start
----------------------------

    $ git clone https://github.com/swrh/diffluens.git
    $ cd diffluens
    $ virtualenv $PWD.venv
    $ . $PWD.venv/bin/activate
    $ pip install -r requirements.txt
    $ mkdir $PWD.db
    $ python manage.py syncdb
    $ python manage.py runserver
