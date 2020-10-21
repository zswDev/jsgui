cp=.:/mnt/c/Users/zsw/Desktop/project/jsgui/rhino-1.7.12.jar:/mnt/c/Users/zsw/Desktop/project/jsgui/WebView.jar

#echo ${cp}

javac -classpath ${cp} Myjs.java

java -classpath ${cp} Myjs