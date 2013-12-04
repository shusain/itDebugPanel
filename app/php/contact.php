<?php

$email = "";
$name = "";
$subject = "" ;
$phone = "" ;
$message = "" ;

//read JSON encoded data from client
$data = json_decode(file_get_contents("php://input"));

if (isset($data->email))
{
	if (isset($data->email)) {
		$email = $data->email ;
	}
	if (isset($data->name)) {
		$name = $data->name ;
	}
	if (isset($data->subject)) {
		$subject = $data->subject ;
	}
	if (isset($data->phone)) {
		$phone = $data->phone ;
	}
	if (isset($data->comment)) {
		$comment = $data->comment ;
	}

	$message = "Phone: ".$phone."<br/>Email: ".$email."<br/>Name: ".$name."<br/>Comment:<br/>".$comment;

	// To send HTML mail, the Content-type header must be set
	$headers  = 'MIME-Version: 1.0' . "\r\n";
	$headers .= 'Content-type: text/html; charset=iso-8859-1' . "\r\n";
	// Additional headers
	$headers .= 'From: ' . $email .  "\r\n";

	mail("shaun@intellectual-tech.com", $subject, $message, $headers);

	echo $message;
}
else
	http_response_code(401);

?>