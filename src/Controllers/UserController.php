<?php
namespace Szurubooru\Controllers;

final class UserController extends AbstractController
{
	private $inputReader;
	private $userService;

	public function __construct(
		\Szurubooru\Services\UserService $userService,
		\Szurubooru\Helpers\InputReader $inputReader)
	{
		$this->inputReader = $inputReader;
		$this->userService = $userService;
	}

	public function registerRoutes(\Szurubooru\Router $router)
	{
		$router->post('/api/users', [$this, 'register']);
		$router->get('/api/users', [$this, 'getFiltered']);
		$router->get('/api/users/:id', [$this, 'getById']);
		$router->put('/api/users/:id', [$this, 'update']);
		$router->delete('/api/users/:id', [$this, 'delete']);
	}

	public function getFiltered()
	{
		//todo: move this to form data constructor
		$searchFormData = new \Szurubooru\FormData\SearchFormData;
		$searchFormData->query = $this->inputReader->query;
		$searchFormData->order = $this->inputReader->order;
		$searchFormData->pageNumber = $this->inputReader->page;
		$searchResult = $this->userService->getFiltered($searchFormData);
		$entities = array_map(function($user) { return new \Szurubooru\ViewProxies\User($user); }, $searchResult->entities);
		return [
			'data' => $entities,
			'pageSize' => $searchResult->filter->pageSize,
			'totalRecords' => $searchResult->totalRecords];
	}

	public function getById($id)
	{
		throw new \BadMethodCallException('Not implemented');
	}

	public function register()
	{
		$input = new \Szurubooru\FormData\RegistrationFormData;
		//todo: move this to form data constructor
		$input->name = $this->inputReader->userName;
		$input->password = $this->inputReader->password;
		$input->email = $this->inputReader->email;

		$user = $this->userService->register($input);

		return new \Szurubooru\ViewProxies\User($user);
	}

	public function update($id)
	{
		throw new \BadMethodCallException('Not implemented');
	}

	public function delete($id)
	{
		throw new \BadMethodCallException('Not implemented');
	}
}
