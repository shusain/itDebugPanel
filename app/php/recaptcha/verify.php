<?php
  require_once('recaptchalib.php');
  $privatekey = "6LfuT-cSAAAAAOMDyozV_0COrmKY3A_S3A5ZL2QY";

  $data = json_decode(file_get_contents("php://input"));

  $resp = recaptcha_check_answer ($privatekey,
                                $_SERVER["REMOTE_ADDR"],
                                $data->challenge,
                                $data->response);
  if (!$resp->is_valid) {
    http_response_code(401);
    // What happens when the CAPTCHA was entered incorrectly
    die ("The reCAPTCHA wasn't entered correctly. Go back and try it again." .
         "(reCAPTCHA said: " . $resp->error . ")");
  } else {
    // Your code here to handle a successful verification
  }
?>